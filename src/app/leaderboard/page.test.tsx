import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import LeaderboardPage from "./page";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock Header component
jest.mock("@/components/Header", () => ({
  Header: ({ onExit, rightContent }: { onExit?: () => void; rightContent?: React.ReactNode }) => (
    <header data-testid="header">
      <button onClick={onExit} data-testid="exit-button">
        Exit
      </button>
      {rightContent && <div data-testid="right-content">{rightContent}</div>}
    </header>
  ),
}));

// Mock SettingsButton component
jest.mock("@/components/SettingsButton", () => ({
  SettingsButton: () => <button data-testid="settings-button">Settings</button>,
}));

// Mock LeaderboardTabs component
jest.mock("@/components/Leaderboard/LeaderboardTabs", () => ({
  LeaderboardTabs: ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: 'global' | 'friends') => void }) => (
    <div data-testid="leaderboard-tabs">
      <button
        data-testid="global-tab"
        onClick={() => onTabChange('global')}
        className={activeTab === 'global' ? 'active' : ''}
      >
        Global
      </button>
      <button
        data-testid="friends-tab"
        onClick={() => onTabChange('friends')}
        className={activeTab === 'friends' ? 'active' : ''}
      >
        Friends
      </button>
    </div>
  ),
}));

// Mock LeaderboardTable component
jest.mock("@/components/Leaderboard/LeaderboardTable", () => ({
  LeaderboardTable: ({ data, activeTab, isAuthenticated }: { data: Array<{ rank: number; playerName: string; score: number }>; activeTab: string; isAuthenticated: boolean }) => (
    <div data-testid="leaderboard-table" data-active-tab={activeTab} data-authenticated={isAuthenticated}>
      {data.map((entry) => (
        <div key={entry.rank} data-testid={`leaderboard-entry-${entry.rank}`}>
          <span>{entry.rank}</span>
          <span>{entry.playerName}</span>
          <span>{entry.score}</span>
        </div>
      ))}
    </div>
  ),
}));

describe("LeaderboardPage", () => {
  const mockPush = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe("Initial Render", () => {
    it("renders leaderboard page with title", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    });

    it("renders header component", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("exit-button")).toBeInTheDocument();
    });

    it("renders settings button", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByTestId("settings-button")).toBeInTheDocument();
    });

    it("renders leaderboard tabs", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByTestId("leaderboard-tabs")).toBeInTheDocument();
      expect(screen.getByTestId("global-tab")).toBeInTheDocument();
      expect(screen.getByTestId("friends-tab")).toBeInTheDocument();
    });

    it("renders leaderboard table", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByTestId("leaderboard-table")).toBeInTheDocument();
    });

    it("starts with global tab active", () => {
      render(<LeaderboardPage />);
      
      const table = screen.getByTestId("leaderboard-table");
      expect(table).toHaveAttribute("data-active-tab", "global");
    });
  });

  describe("Tab Switching", () => {
    it("switches to friends tab when clicked", async () => {
      render(<LeaderboardPage />);
      
      await user.click(screen.getByTestId("friends-tab"));

      const table = screen.getByTestId("leaderboard-table");
      expect(table).toHaveAttribute("data-active-tab", "friends");
    });

    it("switches back to global tab when clicked", async () => {
      render(<LeaderboardPage />);
      
      await user.click(screen.getByTestId("friends-tab"));
      await user.click(screen.getByTestId("global-tab"));

      const table = screen.getByTestId("leaderboard-table");
      expect(table).toHaveAttribute("data-active-tab", "global");
    });
  });

  describe("Authentication - Not Logged In", () => {
    it("does not show profile and logout buttons when not authenticated", () => {
      render(<LeaderboardPage />);
      
      expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    });

    it("sets authenticated to false in leaderboard table", () => {
      render(<LeaderboardPage />);
      
      const table = screen.getByTestId("leaderboard-table");
      expect(table).toHaveAttribute("data-authenticated", "false");
    });

    it("displays global leaderboard without user entry", () => {
      render(<LeaderboardPage />);
      
      // Should not have "Your name" entry (rank 24)
      expect(screen.queryByTestId("leaderboard-entry-24")).not.toBeInTheDocument();
      
      // Should have other entries
      expect(screen.getByTestId("leaderboard-entry-1")).toBeInTheDocument();
      expect(screen.getByTestId("leaderboard-entry-2")).toBeInTheDocument();
    });
  });

  describe("Authentication - Logged In", () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({
        userId: '123',
        userName: 'TestUser'
      }));
    });

    it("shows profile button when authenticated", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Profile")).toBeInTheDocument();
      });
    });

    it("shows logout button when authenticated", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Logout")).toBeInTheDocument();
      });
    });

    it("sets authenticated to true in leaderboard table", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        const table = screen.getByTestId("leaderboard-table");
        expect(table).toHaveAttribute("data-authenticated", "true");
      });
    });

    it("displays global leaderboard with user entry", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId("leaderboard-entry-24")).toBeInTheDocument();
      });
    });

    it("navigates to profile page when profile button clicked", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        const profileButton = screen.getByText("Profile");
        fireEvent.click(profileButton);
      });

      expect(mockPush).toHaveBeenCalledWith("/profile");
    });

    it("logs out user when logout button clicked", async () => {
      render(<LeaderboardPage />);
      
      await waitFor(async () => {
        const logoutButton = screen.getByText("Logout");
        await user.click(logoutButton);
      });

      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('friends')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Navigation", () => {
    it("navigates to home when exit button clicked", async () => {
      render(<LeaderboardPage />);
      
      await user.click(screen.getByTestId("exit-button"));

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Data Display", () => {
    it("displays global leaderboard data", () => {
      render(<LeaderboardPage />);
      
      expect(screen.getByText("nambaone")).toBeInTheDocument();
      expect(screen.getByText("insan2")).toBeInTheDocument();
      expect(screen.getByText("numerotres")).toBeInTheDocument();
    });

    it("displays friends leaderboard data when friends tab is active", async () => {
      render(<LeaderboardPage />);
      
      await user.click(screen.getByTestId("friends-tab"));

      expect(screen.getByText("friend1")).toBeInTheDocument();
      expect(screen.getByText("friend2")).toBeInTheDocument();
      expect(screen.getByText("friend3")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles invalid localStorage data gracefully", () => {
      localStorage.setItem('user', 'invalid-json');
      
      render(<LeaderboardPage />);
      
      expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    });

    it("handles missing userId in localStorage", async () => {
      localStorage.setItem('user', JSON.stringify({
        userName: 'TestUser'
        // userId is missing
      }));
      
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      });
    });

    it("handles missing userName in localStorage", async () => {
      localStorage.setItem('user', JSON.stringify({
        userId: '123'
        // userName is missing
      }));
      
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      });
    });
  });
});
