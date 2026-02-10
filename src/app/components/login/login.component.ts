import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/models';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    username = '';
    password = '';
    errorMessage = '';
    isLoading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    login(): void {
        if (!this.username || !this.password) {
            this.errorMessage = 'Please enter both username and password';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const request: LoginRequest = {
            username: this.username,
            password: this.password
        };

        this.authService.login(request).subscribe({
            next: (account) => {
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'Invalid username or password';
            }
        });
    }
}
