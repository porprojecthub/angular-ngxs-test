import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {AppConstant as APP} from '../app/app.constant';
import Auth from '../models/auth.model';
import * as RequestAction from '../store/actions/request.action';
import { Store } from '@ngxs/store';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient, private store: Store) {}

  login(request: any): Observable<Auth> {
    this.store.dispatch(new RequestAction.AddRequestAction());
    return this.http.post<Auth>(APP.BASE_URL+'/api/login', request);
  }


}
