import { Component, OnDestroy, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import User from 'src/models/user.model';
import Video from 'src/models/video.model';
import {AppConstant as APP} from '../../app/app.constant';
import { AuthState } from '../../store/states/auth.state';
import { UserService } from '../../services/user.service';
import { VideoService } from 'src/services/video.service';
import { Observable, Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import * as RequestAction from '../../store/actions/request.action';
import { Select, Store } from '@ngxs/store';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})

export class UserComponent implements OnInit, OnDestroy { 

  public user: User = {
    userId: undefined,
    username: undefined,
    profile: undefined,
    follower: undefined
  };
  
  public userId: string;
  public followAble: boolean = false;
  public videoList: Array<Video> = [];
  private username: string;
  private sub1: Subscription;
  private sub2: Subscription;
  private followBtn: boolean = true;

  @Select(AuthState.getUserId)
  userId$: Observable<string>;

  constructor(private route:ActivatedRoute,
              private store: Store,
              private userService: UserService,
              private videoService: VideoService,
              private router: Router,
              private title: Title
              ) {}

  async ngOnInit() {

    this.sub1 = this.route.paramMap.subscribe( async params => {
      this.username = params.get('username');
      this.title.setTitle(this.username);
      await this.initData();
    });

  }

  async initData() {
   await new Promise((resolve, reject) => {this.userService.getUser(this.username).toPromise()
      .then(resp => {
        this.user = resp
        resolve(resp);
    })
    .catch((err) => { 
        this.router.navigateByUrl(`/404`);
        reject(err);
      });
    });

    this.user.profile = APP.BASE_URL+'/'+this.user.profile;
    this.sub2 = this.userId$.subscribe(resp => {
      this.userId = resp;
    });

    await this.getFollowStatus()

    await new Promise((resolve, reject) => {this.videoService.getVideoByUsername(this.username).toPromise()
      .then(resp => {
         if(resp.length) {
            this.videoList = resp.map(v => {
              v.thumbnail = APP.BASE_URL+'/'+v.thumbnail;
              return v
            });
          }else {
            this.videoList = [];
          }
        resolve(resp);
    })
    .catch((err) => { 
        this.videoList = [];
        reject(err);
      });
    });
    this.store.dispatch(new RequestAction.ClearRequestAction());
  }

  async getFollowStatus() {
    let request: any = {};
    request.userId = this.userId;
    request.followingId = this.user.userId;
    await new Promise((resolve, reject) => {this.userService.getFollowStatus(request).toPromise()
      .then(resp => {
         if((resp && resp.followed === 'N') && (this.userId !== this.user.userId)){
            this.followAble = true;
          }else{
            this.followAble = false;
          }
        resolve(resp);
    })
    .catch((err) => { 
        reject(err);
      });
    });
  }

  async follow() {
    if(this.followBtn) {
      this.followBtn = false;
      let request: any = {};
      request.userId = this.userId;
      request.followingId = this.user.userId;
      await new Promise((resolve, reject) => {this.userService.follow(request).toPromise()
        .then(async resp => {
          if(resp.status == 'follow'){
            this.user.follower++;
          }else{
            this.user.follower--;
          }
          await this.getFollowStatus();
          resolve(resp);
      })
      .catch((err) => { 
          reject(err);
        });
      });
      this.followBtn = true;
    }
  }

  gotoVideo(videoId) {
    this.router.navigateByUrl(`/video/${videoId}`);
  }

  ngOnDestroy() {
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }

}
