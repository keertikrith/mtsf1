import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TransferService } from '../../services/transfer.service';
import { RewardService } from '../../services/reward.service';
import { TransferRequest } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
    selector: 'app-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
    templateUrl: './transfer.component.html',
    styleUrls: ['./transfer.component.css']
})
export class TransferComponent implements OnInit {
    fromAccountId: number = 0;
    toAccountIdInput: string = '';
    amount: number = 0;
    errorMessage = '';
    successMessage = '';
    isLoading = false;

    // --- INTEGRATED CHECKOUT STATES ---
    redeemRewards: boolean = false;
    availableCashBalance = 0;
    availableRewardPoints = 0;

    constructor(
        private authService: AuthService,
        private transferService: TransferService,
        private rewardService: RewardService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const account = this.authService.getCurrentAccount();
        if (account) {
            this.fromAccountId = account.id;
            this.availableCashBalance = account.balance || 0;

            this.rewardService.getRewardSummary(this.fromAccountId).subscribe({
                next: (summary) => this.availableRewardPoints = summary.totalPoints,
                error: (err) => console.error('Error loading reward metadata summaries', err)
            });
        }
    }

    // CHANGED: 10 points = 1 Rupee. Total point conversion updated to map rule accurately.
    get rewardPointsValueInRupees(): number {
        return this.availableRewardPoints;
    }

    // Calculates how much cash will actually be debited from the bank account
    get netCashDebitedAmount(): number {
        if (!this.amount || this.amount <= 0) return 0;
        if (!this.redeemRewards) return this.amount;
        
        const remainder = this.amount - this.rewardPointsValueInRupees;
        return remainder > 0 ? remainder : 0;
    }

    // Calculates how many points will actually be deducted
    // CHANGED: Formulated step constraints correctly around the 1:10 rule.
    get computedPointsToDeduct(): number {
        if (!this.amount || this.amount <= 0 || !this.redeemRewards) return 0;
        const totalPointsNeeded = this.amount * 1;
        return Math.min(this.availableRewardPoints, totalPointsNeeded);
    }

    // Calculates what reward points will be earned on this transaction (based only on net cash)
    get expectedRewardPointsEarned(): number {
        const cashSpent = this.netCashDebitedAmount;
        if (cashSpent < 100) return 0;
        return Math.floor(cashSpent / 100);
    }

    transfer(): void {
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

        // Validate that combined funding options can cover the cost
        if (this.netCashDebitedAmount > this.availableCashBalance) {
            this.errorMessage = 'Insufficient bank balance to cover the remaining cash portion of this transaction';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const request: TransferRequest = {
            fromAccountId: this.fromAccountId,
            toAccountId: toAccountId,
            amount: this.amount,
            idempotencyKey: this.generateIdempotencyKey(),
            redeemRewards: this.redeemRewards
        };

        this.transferService.transfer(request).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = response.message || 'Transfer completed successfully!';
                this.toAccountIdInput = '';
                this.amount = 0;
                this.redeemRewards = false;

                setTimeout(() => this.router.navigate(['/dashboard']), 2000);
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