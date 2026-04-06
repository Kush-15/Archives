import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartSlide } from '@/components/CartSlide';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { OverlayProvider } from '@/context/OverlayContext';
import { ScrollLockProvider } from '@/context/ScrollLockContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ScrollLockProvider>
      <OverlayProvider>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </OverlayProvider>
    </ScrollLockProvider>
  </BrowserRouter>
);

describe('CartSlide', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  it('should lock scroll when cart opens', async () => {
    const { rerender } = render(
      <TestWrapper>
        <CartSlide isOpen={false} onClose={() => {}} />
      </TestWrapper>
    );

    // Initially scroll should not be locked
    expect(document.body.style.overflow).toBe('');

    // Open cart
    rerender(
      <TestWrapper>
        <CartSlide isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Scroll should be locked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('should unlock scroll when cart closes', async () => {
    const { rerender } = render(
      <TestWrapper>
        <CartSlide isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Wait for scroll to be locked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Close cart
    rerender(
      <TestWrapper>
        <CartSlide isOpen={false} onClose={() => {}} />
      </TestWrapper>
    );

    // Scroll should be unlocked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });

  it('should unlock scroll when component unmounts while open', async () => {
    const { unmount } = render(
      <TestWrapper>
        <CartSlide isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Wait for scroll to be locked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Unmount while cart is open
    unmount();

    // Scroll should be unlocked
    expect(document.body.style.overflow).toBe('');
  });

  it('should not render when isOpen is false', () => {
    render(
      <TestWrapper>
        <CartSlide isOpen={false} onClose={() => {}} />
      </TestWrapper>
    );

    // Cart dialog should not be in document
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <TestWrapper>
        <CartSlide isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Cart dialog should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Your Selection')).toBeInTheDocument();
  });
});
