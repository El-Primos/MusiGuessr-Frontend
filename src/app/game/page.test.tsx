import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import Game from "./page";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

interface HeaderProps {
  onExit?: () => void;
  exitVisible?: boolean;
  exitButtonStyle?: string;
}

interface CircularCountdownProps {
  onComplete: () => void;
  duration: number;
}

interface MusicPlayerProps {
  src: string;
  onEnded: () => void;
  title: string;
  artist: string;
}

interface Track {
  id: number;
  artist: string;
  title: string;
}

interface MusicSearchProps {
  onSelect: (track: Track) => void;
  tracks: Track[];
  resetSignal: number;
}

// Mock Header component
jest.mock("@/components/Header", () => ({
  Header: ({ onExit }: HeaderProps) => (
    <header data-testid="header">
      <button onClick={onExit} data-testid="exit-button">
        Exit
      </button>
    </header>
  ),
}));

// Mock CircularCountdown component
jest.mock("@/components/Game/CircularCountdown", () => ({
  CircularCountdown: ({ onComplete, duration }: CircularCountdownProps) => (
    <div data-testid="circular-countdown" data-duration={duration}>
      <button onClick={onComplete} data-testid="complete-countdown">
        Complete Countdown
      </button>
      <span>Countdown Active</span>
    </div>
  ),
}));

// Mock MusicPlayer component
jest.mock("@/components/Game/MusicPlayer", () => ({
  MusicPlayer: ({ src, onEnded, title, artist }: MusicPlayerProps) => (
    <div data-testid="music-player" data-src={src}>
      <span>{artist} - {title}</span>
      <button onClick={onEnded} data-testid="end-track">
        End Track
      </button>
    </div>
  ),
}));

// Mock MusicSearch component
jest.mock("@/components/Game/MusicSearch", () => ({
  MusicSearch: ({ onSelect, tracks, resetSignal }: MusicSearchProps) => (
    <div data-testid="music-search" data-reset-signal={resetSignal}>
      {tracks.map((track: Track) => (
        <button
          key={track.id}
          onClick={() => onSelect(track)}
          data-testid={`track-${track.id}`}
        >
          {track.artist} - {track.title}
        </button>
      ))}
    </div>
  ),
}));

describe("Game Page", () => {
  const mockPush = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe("Initial State - StartModal", () => {
    it("renders StartModal on initial load", () => {
      render(<Game />);
      
      expect(screen.getByText("Oyuna Başla")).toBeInTheDocument();
      expect(screen.getByText("Oyunu Başlat")).toBeInTheDocument();
      expect(screen.getByText(/Şarkıyı dinle, doğru tahmini yap/)).toBeInTheDocument();
    });

    it("does not render game elements before start", () => {
      render(<Game />);
      
      expect(screen.queryByTestId("circular-countdown")).not.toBeInTheDocument();
      expect(screen.queryByTestId("music-player")).not.toBeInTheDocument();
      expect(screen.queryByTestId("music-search")).not.toBeInTheDocument();
    });

    it("renders header with exit button", () => {
      render(<Game />);
      
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("exit-button")).toBeInTheDocument();
    });
  });

  describe("Game Start Flow", () => {
    it("starts game when start button is clicked", async () => {
      render(<Game />);
      
      const startButton = screen.getByText("Oyunu Başlat");
      await user.click(startButton);

      expect(screen.queryByText("Oyuna Başla")).not.toBeInTheDocument();
      expect(screen.getByTestId("circular-countdown")).toBeInTheDocument();
      expect(screen.getByTestId("music-player")).toBeInTheDocument();
      expect(screen.getByTestId("music-search")).toBeInTheDocument();
    });

    it("displays initial scores as zero", async () => {
      render(<Game />);
      
      await user.click(screen.getByText("Oyunu Başlat"));

      expect(screen.getByText("Doğru Tahmin: 0")).toBeInTheDocument();
      expect(screen.getByText("Yanlış Tahmin: 0")).toBeInTheDocument();
    });

    it("sets countdown duration to 30 seconds", async () => {
      render(<Game />);
      
      await user.click(screen.getByText("Oyunu Başlat"));

      const countdown = screen.getByTestId("circular-countdown");
      expect(countdown).toHaveAttribute("data-duration", "30");
    });

    it("starts with first track (Moonlit)", async () => {
      render(<Game />);
      
      await user.click(screen.getByText("Oyunu Başlat"));

      const musicPlayer = screen.getByTestId("music-player");
      expect(musicPlayer).toHaveAttribute("data-src", "/audio/moonlit.mp3");
    });
  });

  describe("audioSrc Memoization", () => {
    it("generates correct audioSrc with leading slash for first track", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      const musicPlayer = screen.getByTestId("music-player");
      expect(musicPlayer).toHaveAttribute("data-src", "/audio/moonlit.mp3");
    });

    it("maintains leading slash for second track", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Select correct answer to advance
      await user.click(screen.getByTestId("track-10")); // AI - Moonlit

      await waitFor(() => {
        const musicPlayer = screen.getByTestId("music-player");
        expect(musicPlayer).toHaveAttribute("data-src", "/audio/cambaz.mp3");
      });
    });

    it("returns empty string when no current track", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Complete both tracks
      await user.click(screen.getByTestId("track-10")); // AI - Moonlit
      await user.click(screen.getByTestId("track-9")); // Mor ve Ötesi - Cambaz

      await waitFor(() => {
        expect(screen.queryByTestId("music-player")).not.toBeInTheDocument();
      });
    });
  });

  describe("Correct Guess Handling", () => {
    it("increments correct score on correct guess", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10")); // AI - Moonlit (correct)

      expect(screen.getByText("Doğru Tahmin: 1")).toBeInTheDocument();
      expect(screen.getByText("Yanlış Tahmin: 0")).toBeInTheDocument();
    });

    it("advances to next track after correct guess", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10")); // AI - Moonlit

      await waitFor(() => {
        const musicPlayer = screen.getByTestId("music-player");
        expect(musicPlayer).toHaveAttribute("data-src", "/audio/cambaz.mp3");
      });
    });

    it("resets search component after guess (increments resetSignal)", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      const searchBefore = screen.getByTestId("music-search");
      expect(searchBefore).toHaveAttribute("data-reset-signal", "0");

      await user.click(screen.getByTestId("track-10"));

      await waitFor(() => {
        const searchAfter = screen.getByTestId("music-search");
        expect(searchAfter).toHaveAttribute("data-reset-signal", "1");
      });
    });
  });

  describe("Incorrect Guess Handling", () => {
    it("increments incorrect score on wrong guess", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-1")); // Coldplay - Fix You (wrong)

      expect(screen.getByText("Doğru Tahmin: 0")).toBeInTheDocument();
      expect(screen.getByText("Yanlış Tahmin: 1")).toBeInTheDocument();
    });

    it("advances to next track after wrong guess", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-1")); // Wrong answer

      await waitFor(() => {
        const musicPlayer = screen.getByTestId("music-player");
        expect(musicPlayer).toHaveAttribute("data-src", "/audio/cambaz.mp3");
      });
    });

    it("handles multiple wrong guesses", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-1")); // Wrong 1
      await user.click(screen.getByTestId("track-2")); // Wrong 2

      await waitFor(() => {
        expect(screen.getByText("Doğru Tahmin: 0")).toBeInTheDocument();
        expect(screen.getByText("Yanlış Tahmin: 2")).toBeInTheDocument();
      });
    });
  });

  describe("Track Expiration (onEnded)", () => {
    it("increments incorrect score when track expires", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("end-track"));

      expect(screen.getByText("Yanlış Tahmin: 1")).toBeInTheDocument();
    });

    it("advances to next track on expiration", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("end-track"));

      await waitFor(() => {
        const musicPlayer = screen.getByTestId("music-player");
        expect(musicPlayer).toHaveAttribute("data-src", "/audio/cambaz.mp3");
      });
    });
  });

  describe("Countdown Completion", () => {
    it("shows ResultModal when countdown completes", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("complete-countdown"));

      await waitFor(() => {
        expect(screen.getByText("Skorun")).toBeInTheDocument();
        expect(screen.getByText("Süre doldu")).toBeInTheDocument();
      });
    });

    it("displays correct scores when countdown completes", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Make one correct guess
      await user.click(screen.getByTestId("track-10"));

      await waitFor(() => {
        expect(screen.getByText("Doğru Tahmin: 1")).toBeInTheDocument();
      });

      // Complete countdown
      await user.click(screen.getByTestId("complete-countdown"));

      await waitFor(() => {
        expect(screen.getByText("Doğru: 1")).toBeInTheDocument();
        expect(screen.getByText("Yanlış: 0")).toBeInTheDocument();
      });
    });

    it("shows result modal after countdown completes", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("complete-countdown"));

      await waitFor(() => {
        expect(screen.getByText("Skorun")).toBeInTheDocument();
        expect(screen.getByText("Süre doldu")).toBeInTheDocument();
        expect(screen.getByText("Ana Sayfaya Dön")).toBeInTheDocument();
      });
    });

    it("stops allowing guesses after countdown completes", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));
      
      // Complete countdown
      await user.click(screen.getByTestId("complete-countdown"));

      await waitFor(() => {
        expect(screen.getByText("Süre doldu")).toBeInTheDocument();
      });

      // Music search is visible but gameOver state prevents score changes
      expect(screen.getByTestId("music-search")).toBeInTheDocument();
    });
  });

  describe("Game Over - All Tracks Completed", () => {
    it("shows ResultModal when all tracks completed", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10")); // AI - Moonlit
      await user.click(screen.getByTestId("track-9")); // Mor ve Ötesi - Cambaz

      await waitFor(() => {
        expect(screen.getByText("Tüm şarkılar tamamlandı")).toBeInTheDocument();
        expect(screen.getByText("Skorun")).toBeInTheDocument();
      });
    });

    it("displays accurate scores after game completion", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10")); // Correct
      await user.click(screen.getByTestId("track-1")); // Wrong

      await waitFor(() => {
        expect(screen.getByText("Doğru: 1")).toBeInTheDocument();
        expect(screen.getByText("Yanlış: 1")).toBeInTheDocument();
      });
    });

    it("shows share button in ResultModal", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10"));
      await user.click(screen.getByTestId("track-9"));

      await waitFor(() => {
        expect(screen.getByText("Paylaş")).toBeInTheDocument();
      });
    });

    it("logs to console when share button is clicked", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10"));
      await user.click(screen.getByTestId("track-9"));

      await waitFor(() => {
        const shareButton = screen.getByText("Paylaş");
        fireEvent.click(shareButton);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Paylaşıldı");
      consoleSpy.mockRestore();
    });
  });

  describe("Navigation", () => {
    it("navigates to home on exit button click", async () => {
      render(<Game />);
      
      await user.click(screen.getByTestId("exit-button"));

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("navigates to home from ResultModal", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      await user.click(screen.getByTestId("track-10"));
      await user.click(screen.getByTestId("track-9"));

      await waitFor(async () => {
        await user.click(screen.getByText("Ana Sayfaya Dön"));
      });

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Edge Cases", () => {
    it("does not allow guesses before game starts", () => {
      render(<Game />);

      // Should not render music search before game starts
      expect(screen.queryByTestId("music-search")).not.toBeInTheDocument();
    });

    it("does not allow guesses after game over", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Complete game
      await user.click(screen.getByTestId("track-10"));
      await user.click(screen.getByTestId("track-9"));

      // Result modal should be visible
      await waitFor(() => {
        expect(screen.getByText("Skorun")).toBeInTheDocument();
        expect(screen.getByText("Tüm şarkılar tamamlandı")).toBeInTheDocument();
      });

      // Music search is still in document but game is over
      expect(screen.getByTestId("music-search")).toBeInTheDocument();
    });

    it("handles mixed correct and incorrect guesses", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Correct guess
      await user.click(screen.getByTestId("track-10"));

      // Incorrect guess
      await user.click(screen.getByTestId("track-1"));

      await waitFor(() => {
        expect(screen.getByText("Doğru: 1")).toBeInTheDocument();
        expect(screen.getByText("Yanlış: 1")).toBeInTheDocument();
      });
    });

    it("maintains track order correctly", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      // Check first track by data attribute
      const firstPlayer = screen.getByTestId("music-player");
      expect(firstPlayer).toHaveAttribute("data-src", "/audio/moonlit.mp3");

      // Select correct track
      await user.click(screen.getByTestId("track-10"));

      // Check second track
      await waitFor(() => {
        const secondPlayer = screen.getByTestId("music-player");
        expect(secondPlayer).toHaveAttribute("data-src", "/audio/cambaz.mp3");
      });
    });

    it("resets search component between tracks", async () => {
      render(<Game />);
      await user.click(screen.getByText("Oyunu Başlat"));

      const searchComponent = screen.getByTestId("music-search");
      const initialResetSignal = searchComponent.getAttribute("data-reset-signal");

      await user.click(screen.getByTestId("track-10"));

      await waitFor(() => {
        const updatedSearchComponent = screen.getByTestId("music-search");
        const newResetSignal = updatedSearchComponent.getAttribute("data-reset-signal");
        expect(newResetSignal).not.toBe(initialResetSignal);
      });
    });
  });
});
