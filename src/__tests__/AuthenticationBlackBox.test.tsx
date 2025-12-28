import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import Auth from '../app/auth/page';

// Mock mocks
let mockMode = 'signup'; // Control variable for search params

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
    useSearchParams: () => ({
        get: (key: string) => (key === 'mode' ? mockMode : null),
    }),
}));

// Mock Language Context
jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

// Mock Components
jest.mock('@/components/Button', () => {
    return function MockButton({ onClick, children, className }: any) {
        return <button onClick={onClick} className={className}>{children}</button>;
    };
});

jest.mock('@/components/Header', () => ({
    Header: () => <div data-testid="mock-header">Header</div>,
}));

// Mock Fetch
global.fetch = jest.fn();

describe('Black Box Testing: Registration (TC-REG)', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        mockMode = 'signup'; // Reset to default
    });

    // TC-REG-01: Valid Registration
    it('TC-REG-01: Valid Registration - Submits form successfully', async () => {
        render(<Auth />);

        // Fill Form
        // Name
        fireEvent.change(screen.getByPlaceholderText('auth.enterFullName'), { target: { value: 'John' } });
        // Username - placeholder is "johndoe123" hardcoded in page.tsx
        fireEvent.change(screen.getByPlaceholderText('johndoe123'), { target: { value: 'john_doe' } });
        // Email
        fireEvent.change(screen.getByPlaceholderText('auth.enterEmail'), { target: { value: 'john@test.com' } });
        // Password
        fireEvent.change(screen.getByPlaceholderText('auth.minPassword'), { target: { value: 'password123' } });

        // Mock Success Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'fake-jwt', id: 1, username: 'john_doe' }),
        });

        // Submit
        const submitButton = screen.getByText('auth.createAccountButton');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/register'), expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    name: 'John',
                    username: 'john_doe',
                    email: 'john@test.com',
                    password: 'password123'
                })
            }));
        });
    });

    // TC-REG-02: Invalid Email Format
    it('TC-REG-02: Invalid Email Format - Shows error', async () => {
        render(<Auth />);

        fireEvent.change(screen.getByPlaceholderText('auth.enterFullName'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('johndoe123'), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByPlaceholderText('auth.enterEmail'), { target: { value: 'johntest.com' } }); // Invalid
        fireEvent.change(screen.getByPlaceholderText('auth.minPassword'), { target: { value: 'password123' } });

        const submitButton = screen.getByText('auth.createAccountButton');
        fireEvent.click(submitButton);

        // Expect validation error
        expect(await screen.findByText('auth.validEmail')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-REG-03: Password Too Short
    it('TC-REG-03: Password Too Short - Shows error', async () => {
        render(<Auth />);

        fireEvent.change(screen.getByPlaceholderText('auth.enterFullName'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('johndoe123'), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByPlaceholderText('auth.enterEmail'), { target: { value: 'john@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('auth.minPassword'), { target: { value: '123' } }); // Short

        const submitButton = screen.getByText('auth.createAccountButton');
        fireEvent.click(submitButton);

        expect(await screen.findByText('auth.passwordLength')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-REG-04: Missing Name
    it('TC-REG-04: Missing Name - Shows error', async () => {
        render(<Auth />);

        // Name is skipped
        fireEvent.change(screen.getByPlaceholderText('johndoe123'), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByPlaceholderText('auth.enterEmail'), { target: { value: 'john@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('auth.minPassword'), { target: { value: 'password123' } });

        const submitButton = screen.getByText('auth.createAccountButton');
        fireEvent.click(submitButton);

        expect(await screen.findByText('auth.fillAllFields')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-LOG-01: Valid Login
    it('TC-LOG-01: Valid Login - Submits form successfully', async () => {
        mockMode = 'login';
        render(<Auth />);

        // Fill Form
        fireEvent.change(screen.getByPlaceholderText('auth.enterUsername'), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByPlaceholderText('auth.enterPassword'), { target: { value: 'password123' } });

        // Mock Success Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'fake-jwt', id: 1, username: 'john_doe' }),
        });

        // Submit
        const submitButton = screen.getByText('auth.loginButton');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    username: 'john_doe',
                    password: 'password123'
                })
            }));
        });
    });

    // TC-LOG-02: Invalid Credentials
    it('TC-LOG-02: Invalid Credentials - Shows error', async () => {
        mockMode = 'login';
        render(<Auth />);

        // Fill Form
        fireEvent.change(screen.getByPlaceholderText('auth.enterUsername'), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByPlaceholderText('auth.enterPassword'), { target: { value: 'wrongpass' } });

        // Mock Error Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Invalid credentials' }),
        });

        const submitButton = screen.getByText('auth.loginButton');
        fireEvent.click(submitButton);

        expect(await screen.findByText('auth.invalidCredentials')).toBeInTheDocument();
    });
});
