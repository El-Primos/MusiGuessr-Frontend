import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Game from '../app/game/page';
import { Track } from '@/components/Game/MusicSearch';

// Mock Router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn((key: string) => {
            if (key === 'playlist') return '1';
            return null;
        }),
    }),
}));

// Mock API Hook
const mockApiFetch = jest.fn();
jest.mock('@/lib/useApi', () => ({
    useApi: () => ({
        apiFetch: mockApiFetch,
        token: 'fake-token',
    }),
}));

// Mock Language Context
jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

// Mock Components
jest.mock('@/components/Header', () => ({
    Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/Game/MusicPlayer', () => ({
    MusicPlayer: () => <div data-testid="mock-music-player">Music Player</div>,
}));

jest.mock('@/components/Game/CircularCountdown', () => ({
    CircularCountdown: ({ onComplete }: { onComplete: () => void }) => (
        <div data-testid="mock-countdown">
            Countdown
            <button data-testid="trigger-timeout" onClick={onComplete}>Timeout</button>
        </div>
    ),
}));

jest.mock('@/components/Game/MusicSearch', () => ({
    MusicSearch: ({ onSelect }: { onSelect: (track: Track) => void }) => (
        <div data-testid="mock-music-search">
            <button
                data-testid="simulate-guess"
                onClick={() => onSelect({ id: 100, name: 'Song A', artists: [{ name: 'Artist A' }], album: { name: 'Album A', images: [] }, external_urls: { spotify: '' }, preview_url: '' } as any)}
            >
                Guess Song A
            </button>
        </div>
    ),
}));

describe('Unit Testing: Gameplay (TC-FE-GAME)', () => {
    beforeEach(() => {
        mockApiFetch.mockClear();
    });

    // TC-FE-GAME-01: Start Game (Creation & Start)
    it('TC-FE-GAME-01: Start Game - Creates and starts game successfully', async () => {
        render(<Game />);

        // 1. Initial State: Start Modal visible
        expect(screen.getByText('game.startGame')).toBeInTheDocument();

        // 2. Mock API Responses
        // Create Game Response
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 123 }),
        });
        // Start Game Response (Next Round Data)
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 123,
                currentRound: 1,
                totalRounds: 5,
                nextPreviewUrl: 'http://audio.mp3',
            }),
        });

        // 3. User Clicks Start
        fireEvent.click(screen.getByText('game.startGame'));

        // 4. Verify API Calls
        await waitFor(() => {
            // First call: Create Game
            expect(mockApiFetch).toHaveBeenNthCalledWith(1, '/api/games', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ playlistId: 1 })
            }));
            // Second call: Start Game
            expect(mockApiFetch).toHaveBeenNthCalledWith(2, '/api/games/123/start', expect.objectContaining({
                method: 'POST'
            }));
        });

        // 5. Verify Game UI Elements appear
        await waitFor(() => {
            expect(screen.queryByText('game.startGame')).not.toBeInTheDocument();
            expect(screen.getByTestId('mock-music-player')).toBeInTheDocument();
            expect(screen.getByText('game.round 1 / 5')).toBeInTheDocument();
        });
    });

    // TC-FE-GAME-02: Submit Guess
    it('TC-FE-GAME-02: Submit Guess - Sends guess and shows answer modal', async () => {
        render(<Game />);

        // Setup Game State (Already started)
        const startGameButton = screen.getByText('game.startGame');

        mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123 }) }); // Create
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 123, currentRound: 1, totalRounds: 5, nextPreviewUrl: 'A' })
        }); // Start

        fireEvent.click(startGameButton);
        await waitFor(() => expect(screen.getByTestId('mock-music-search')).toBeInTheDocument());

        // Prepare Guess Response
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                correct: true,
                earnedScore: 100,
                correctMusicId: 100,
                totalScore: 100, // Round transition data stored in window
                nextRound: 2,
                gameFinished: false,
                nextPreviewUrl: 'B'
            })
        });

        // Mock Music Details Fetch (called after guess response)
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 100, name: 'Song A', artist: { name: 'Artist A' } })
        });

        // Simulate User Guess
        fireEvent.click(screen.getByTestId('simulate-guess'));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith('/api/games/123/guess', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"musicId":100')
            }));
        });

        // Verify Answer Modal
        await waitFor(() => {
            expect(screen.getByText('game.correct')).toBeInTheDocument();
            expect(screen.getByText('+100 game.points')).toBeInTheDocument();
        });
    });

    // TC-FE-GAME-04: Finish Game
    it('TC-FE-GAME-04: End of Game - Shows Result Modal when game finishes', async () => {
        render(<Game />);

        // Start Game
        const startGameButton = screen.getByText('game.startGame');
        mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123 }) }); // Create
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 123, currentRound: 5, totalRounds: 5, nextPreviewUrl: 'A' })
        }); // Start
        fireEvent.click(startGameButton);
        await waitFor(() => expect(screen.getByTestId('mock-music-search')).toBeInTheDocument());

        // Guess Last Round -> Triggers Finish
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                correct: true,
                earnedScore: 50,
                correctMusicId: 100,
                totalScore: 150,
                nextRound: 6,
                gameFinished: true, // Key signal
                nextPreviewUrl: null
            })
        });
        mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 100 }) }); // Music Details

        // Submit Guess
        fireEvent.click(screen.getByTestId('simulate-guess'));

        // Modal Appears
        await waitFor(() => expect(screen.getByText('game.correct')).toBeInTheDocument());

        // Mock Finish Call (called inside handleFinishGame which is called by round transition)
        mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

        // Click Continue on Answer Modal
        const continueButton = screen.getByText('game.continue');
        fireEvent.click(continueButton); // Calls handleContinue -> handleRoundTransition -> handleFinishGame

        await waitFor(() => {
            // Should call finish endpoint
            expect(mockApiFetch).toHaveBeenCalledWith('/api/games/123/finish', expect.objectContaining({ method: 'POST' }));
            // Should show Result Modal
            expect(screen.getByText('game.gameOver')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument(); // Final Score
        });
    });
});
