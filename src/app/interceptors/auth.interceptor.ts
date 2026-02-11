import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.url.includes('/accounts/login') || (req.url.includes('/accounts') && req.method === 'POST')) {
        return next(req);
    }

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
