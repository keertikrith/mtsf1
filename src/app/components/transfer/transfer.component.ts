import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TransferService } from '../../services/transfer.service';
import { TransferRequest } from '../../models/models';

@Component({
    selector: 'app-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './transfer.component.html',
    styleUrls: ['./transfer.component.css']
})
export class TransferComponent implements OnInit {
    fromAccountId: number = 0;
    toAccountId: number = 0;
    amount: number = 0;
    errorMessage = '';
    successMessage = '';
    isLoading = false;

    constructor(
        private authService: AuthService,
        private transferService: TransferService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const account = this.authService.getCurrentAccount();
        if (account) {
            this.fromAccountId = account.id;
        }
    }

    transfer(): void {
        if (!this.toAccountId || this.amount <= 0) {
            this.errorMessage = 'Please enter valid recipient account ID and amount';
            return;
        }

        if (this.toAccountId === this.fromAccountId) {
            this.errorMessage = 'Cannot transfer to the same account';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const request: TransferRequest = {
            fromAccountId: this.fromAccountId,
            toAccountId: this.toAccountId,
            amount: this.amount,
            idempotencyKey: this.generateIdempotencyKey()
        };

        this.transferService.transfer(request).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = `Transfer successful! Transaction ID: ${response.transactionId}`;
                this.toAccountId = 0;
                this.amount = 0;

                // Navigate to dashboard after 2 seconds
                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'Transfer failed. Please try again.';
            }
        });
    }

    private generateIdempotencyKey(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
