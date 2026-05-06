import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          You are not registered to use this application. Please contact your teacher or the app administrator to request access.
        </p>
        <div className="p-4 bg-muted rounded-xl text-left text-sm text-muted-foreground space-y-1.5 mb-6">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">What you can do:</p>
          <p>• Verify you're logged in with the correct account</p>
          <p>• Ask your teacher to invite you to the class</p>
          <p>• Try logging out and signing back in</p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;