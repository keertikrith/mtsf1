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
    toAccountIdInput: string = ''; // Changed from number to string input
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
        // Parse account ID from input (handle "ACC-" prefix)
        let toAccountId: number = 0;
        if (this.toAccountIdInput) {
            const cleanId = this.toAccountIdInput.replace(/^ACC-/i, '').replace(/^acc-/i, '');
            toAccountId = parseInt(cleanId, 10);
        }

        if (!toAccountId || isNaN(toAccountId) || this.amount <= 0) {
            this.errorMessage = 'Please enter valid recipient account ID and amount';
            return;
        }

        if (toAccountId === this.fromAccountId) {
            this.errorMessage = 'Cannot transfer to the same account';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const request: TransferRequest = {
            fromAccountId: this.fromAccountId,
            toAccountId: toAccountId,
            amount: this.amount,
            idempotencyKey: this.generateIdempotencyKey()
        };

        this.transferService.transfer(request).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = `Transfer successful! Transaction ID: ${response.transactionId}`;
                this.toAccountIdInput = '';
                this.amount = 0;

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
