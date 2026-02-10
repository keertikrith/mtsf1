import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Skip auth for login and create account endpoints
    if (req.url.includes('/accounts/login') || (req.url.includes('/accounts') && req.method === 'POST')) {
        return next(req);
    }

    // Add Basic Auth header
    const credentials = localStorage.getItem('credentials');
    if (credentials) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Basic ${credentials}`
            }
        });
        return next(authReq);
    }

    return next(req);
};
