import React, { useState, useCallback } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SafeButtonProps extends ButtonProps {
  /** Handler function - can be async */
  onAction?: () => void | Promise<void>;
  /** Show loading state while executing */
  showLoading?: boolean;
  /** Disable button while executing */
  disableWhileLoading?: boolean;
  /** Confirmation message before executing */
  confirmMessage?: string;
  /** Custom loading label */
  loadingLabel?: string;
}

/**
 * ✅ FIX: Button component with built-in safety features
 * - Prevents double-clicks automatically
 * - Shows loading state visually
 * - Handles both sync and async handlers
 * - Provides visual feedback
 */
export const SafeButton = React.forwardRef<HTMLButtonElement, SafeButtonProps>(
  (
    {
      onAction,
      showLoading = true,
      disableWhileLoading = true,
      confirmMessage,
      loadingLabel,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        // ✅ Prevent default and double-click
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || disabled) {
          console.warn('[SafeButton] Button is disabled or loading');
          return;
        }

        // ✅ Check confirmation
        if (confirmMessage && !window.confirm(confirmMessage)) {
          return;
        }

        if (!onAction) return;

        setIsLoading(true);

        try {
          const result = onAction();

          // ✅ Handle async actions
          if (result instanceof Promise) {
            await result;
          }
        } catch (error) {
          console.error('[SafeButton] Error:', error);
        } finally {
          setIsLoading(false);
        }
      },
      [onAction, isLoading, disabled, confirmMessage]
    );

    const isDisabled = disabled || (disableWhileLoading && isLoading);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
        {...props}
      >
        {isLoading && showLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {loadingLabel || 'Processando...'}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

SafeButton.displayName = 'SafeButton';