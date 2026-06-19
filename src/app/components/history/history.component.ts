import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent],
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
    transactions: Transaction[] = [];
    currentAccountId: number = 0;
    isLoading = true;
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private accountService: AccountService
    ) { }

    ngOnInit(): void {
        const account = this.authService.getCurrentAccount();
        if (account) {
            this.currentAccountId = account.id;
            this.loadTransactions();
        }
    }

    loadTransactions(): void {
        this.accountService.getTransactions(this.currentAccountId).subscribe({
            next: (transactions) => {
                this.transactions = transactions;
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = 'Failed to load transaction history';
                this.isLoading = false;
            }
        });
    }

    getTransactionType(transaction: Transaction): string {
        return transaction.fromAccountId === this.currentAccountId ? 'DEBIT' : 'CREDIT';
    }

    getOtherAccountId(transaction: Transaction): number {
        return transaction.fromAccountId === this.currentAccountId
            ? transaction.toAccountId
            : transaction.fromAccountId;
    }

    // NEW: Extracts the points value from the failureReason text (e.g., "REDEEMED_POINTS: 50")
    getRedeemedPoints(transaction: any): number {
        if (transaction.failureReason && transaction.failureReason.startsWith('REDEEMED_POINTS:')) {
            const parts = transaction.failureReason.split(':');
            if (parts.length > 1) {
                const points = parseInt(parts[1].trim(), 10);
                return isNaN(points) ? 0 : points;
            }
        }
        return 0;
    }

    // NEW: Calculates net cash spent based on the 1 point = 1 Rupee rule
    getNetCashDebited(transaction: any): number {
        const points = this.getRedeemedPoints(transaction);
        const net = transaction.amount - points;
        return net > 0 ? net : 0;
    }
}