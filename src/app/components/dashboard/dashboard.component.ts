import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/models';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    account: Account | null = null;
    balance: number = 0;
    isLoading = true;

    constructor(
        private authService: AuthService,
        private accountService: AccountService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadAccountData();
    }

    loadAccountData(): void {
        this.account = this.authService.getCurrentAccount();
        if (this.account) {
            this.accountService.getBalance(this.account.id).subscribe({
                next: (data) => {
                    this.balance = data.balance;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading balance:', error);
                    this.isLoading = false;
                }
            });
        }
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
