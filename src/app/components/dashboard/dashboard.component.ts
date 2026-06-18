import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { RewardService } from '../../services/reward.service';
import { Account } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    account: Account | null = null;
    balance: number = 0;
    totalRewardPoints: number = 0;
    isLoading = true;
    isMobileMenuOpen = false; // Added for responsive mobile menu toggle

    constructor(
        private authService: AuthService,
        private accountService: AccountService,
        private rewardService: RewardService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadAccountData();
    }

    loadAccountData(): void {
        this.account = this.authService.getCurrentAccount();
        if (this.account) {
            const accountId = this.account.id;

            this.accountService.getBalance(accountId).subscribe({
                next: (data) => {
                    this.balance = data.balance;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading balance:', error);
                    this.isLoading = false;
                }
            });

            this.rewardService.getRewardSummary(accountId).subscribe({
                next: (summary) => {
                    this.totalRewardPoints = summary.totalPoints;
                },
                error: () => {
                    this.totalRewardPoints = 0;
                }
            });
        }
    }

    toggleMobileMenu(): void {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}