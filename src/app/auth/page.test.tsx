import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import Auth from "./page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Header component
jest.mock("@/components/Header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock Button component
jest.mock("@/components/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button onClick={onClick} className={className} data-testid="submit-button">
      {children}
    </button>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe("Auth Page", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockGet = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    
    mockGet.mockReturnValue(null);
  });

  describe("Initial Render", () => {
    it("renders login mode by default", () => {
      render(<Auth />);
      
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByText("Login to continue")).toBeInTheDocument();
    });

    it("renders header component", () => {
      render(<Auth />);
      
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("shows login form fields", () => {
      render(<Auth />);
      
      expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });

    it("shows login submit button", () => {
      render(<Auth />);
      
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Login");
    });
  });

  describe("Mode Switching", () => {
    it("switches to signup mode when signup button clicked", async () => {
      render(<Auth />);
      
      const signupButton = screen.getByRole("button", { name: "Sign Up" });
      await user.click(signupButton);

      expect(mockReplace).toHaveBeenCalledWith("/auth?mode=signup");
    });

    it("switches to login mode when login button clicked in signup", async () => {
      mockGet.mockReturnValue("signup");
      render(<Auth />);
      
      // Get the first Login button (the toggle button at top)
      const loginButtons = screen.getAllByRole("button", { name: "Login" });
      await user.click(loginButtons[0]);

      expect(mockReplace).toHaveBeenCalledWith("/auth?mode=login");
    });

    it("renders signup form in signup mode", () => {
      mockGet.mockReturnValue("signup");
      render(<Auth />);
      
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.getByText("Sign up to start playing")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });
  });

  describe("Login Flow", () => {
    it("shows validation error when fields are empty", async () => {
      render(<Auth />);
      
      await user.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Please fill in username and password.")).toBeInTheDocument();
    });

    it("calls login API with correct credentials", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "123",
          username: "testuser",
          email: "test@example.com",
          role: "USER",
          accessToken: "token123",
          refreshToken: "refresh123",
          tokenType: "Bearer",
        }),
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "password123",
          }),
        })
      );
    });

    it("stores user data and navigates on successful login", async () => {
      const mockUserData = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        role: "USER",
        accessToken: "token123",
        refreshToken: "refresh123",
        tokenType: "Bearer",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        const stored = localStorage.getItem("user");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.username).toBe("testuser");
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("shows error message on login failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Invalid credentials",
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "wronguser");
      await user.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("shows loading state during login", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({}),
        }), 100))
      );

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Logging in...")).toBeInTheDocument();
    });
  });

  describe("Signup Flow", () => {
    beforeEach(() => {
      mockGet.mockReturnValue("signup");
    });

    it("shows validation error when fields are empty", async () => {
      render(<Auth />);
      
      await user.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    });

    it("validates email format", async () => {
      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "Test User");
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("you@example.com"), "invalid-email");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Please enter a valid email.")).toBeInTheDocument();
    });

    it("validates password length", async () => {
      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "Test User");
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "12345");
      await user.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Password must be at least 6 characters.")).toBeInTheDocument();
    });

    it("calls signup API with correct data", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "123",
          username: "newuser",
          email: "new@example.com",
          role: "USER",
          accessToken: "token123",
          refreshToken: "refresh123",
          tokenType: "Bearer",
        }),
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "New User");
      await user.type(screen.getByPlaceholderText("username"), "newuser");
      await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/register"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New User",
            username: "newuser",
            email: "new@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("stores user data and navigates on successful signup", async () => {
      const mockUserData = {
        id: "123",
        username: "newuser",
        email: "new@example.com",
        role: "USER",
        accessToken: "token123",
        refreshToken: "refresh123",
        tokenType: "Bearer",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "New User");
      await user.type(screen.getByPlaceholderText("username"), "newuser");
      await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        const stored = localStorage.getItem("user");
        expect(stored).toBeTruthy();
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("shows error message on signup failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Username already exists" }),
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "Test User");
      await user.type(screen.getByPlaceholderText("username"), "existinguser");
      await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Username already exists")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to home when 'Back to home' is clicked", async () => {
      render(<Auth />);
      
      await user.click(screen.getByText("Back to home"));

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Edge Cases", () => {
    it("trims whitespace from login username", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "  testuser  ");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              username: "testuser",
              password: "password123",
            }),
          })
        );
      });
    });

    it("trims whitespace from signup fields", async () => {
      mockGet.mockReturnValue("signup");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("name"), "  New User  ");
      await user.type(screen.getByPlaceholderText("username"), "  newuser  ");
      await user.type(screen.getByPlaceholderText("you@example.com"), "  new@example.com  ");
      await user.type(screen.getByPlaceholderText("min 6 chars"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              name: "New User",
              username: "newuser",
              email: "new@example.com",
              password: "password123",
            }),
          })
        );
      });
    });

    it("handles network errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("prevents multiple submissions during loading", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({}),
        }), 100))
      );

      render(<Auth />);
      
      await user.type(screen.getByPlaceholderText("username"), "testuser");
      await user.type(screen.getByPlaceholderText("••••••••"), "password123");
      
      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);
      await user.click(submitButton); // Second click

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
