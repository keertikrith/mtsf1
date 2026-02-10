import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/models';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
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
}
