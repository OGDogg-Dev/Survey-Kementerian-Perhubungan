import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold">Something went wrong.</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Please refresh the page or try again later.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

