import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, CreateAccountRequest, Transaction } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private apiUrl = 'http://localhost:8080/api/v1/accounts';

    constructor(private http: HttpClient) { }

    createAccount(request: CreateAccountRequest): Observable<Account> {
        return this.http.post<Account>(this.apiUrl, request);
    }

    getAccount(id: number): Observable<Account> {
        return this.http.get<Account>(`${this.apiUrl}/${id}`);
    }

    getBalance(id: number): Observable<{ balance: number }> {
        return this.http.get<{ balance: number }>(`${this.apiUrl}/${id}/balance`);
    }

    getTransactions(id: number): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/${id}/transactions`);
    }
}
