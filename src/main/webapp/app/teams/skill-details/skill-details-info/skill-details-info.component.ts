import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ITeam } from 'app/shared/model/team.model';
import { ISkill } from 'app/shared/model/skill.model';
import { TeamSkillService } from 'app/entities/team-skill';
import { TeamsService } from 'app/teams/teams.service';
import { IBadge } from 'app/shared/model/badge.model';
import { ILevel } from 'app/shared/model/level.model';
import { LevelService } from 'app/entities/level';
import { BadgeService } from 'app/entities/badge';
import * as moment from 'moment';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { AchievableSkill, IAchievableSkill } from 'app/shared/model/achievable-skill.model';
import { TeamsSkillsService } from 'app/teams/teams-skills.service';
import { TeamsSelectionService } from 'app/teams/teams-selection/teams-selection.service';

@Component({
    selector: 'jhi-skill-details-info',
    templateUrl: './skill-details-info.component.html',
    styleUrls: ['./skill-details-info.scss']
})
export class SkillDetailsInfoComponent implements OnInit {
    @Input() team: ITeam;

    @Input() skill: ISkill;

    @Input() achievableSkill: IAchievableSkill;

    @Output() onSkillChanged = new EventEmitter<IAchievableSkill>();

    achievedByTeams: ITeam[] = [];

    neededForLevels: ILevel[] = [];

    neededForBadges: IBadge[] = [];

    constructor(
        private route: ActivatedRoute,
        private teamSkillService: TeamSkillService,
        private teamsSkillsService: TeamsSkillsService,
        private teamsSelectionService: TeamsSelectionService,
        private teamsService: TeamsService,
        private levelService: LevelService,
        private badgeService: BadgeService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData() {
        this.achievedByTeams = [];
        this.neededForLevels = [];
        this.neededForBadges = [];
        this.achievableSkill = new AchievableSkill();

        this.teamSkillService.query({ 'skillId.equals': this.skill.id, 'completedAt.specified': true }).subscribe(res => {
            const teamsId = res.body.map(ts => ts.teamId);
            if (teamsId.length !== 0) {
                this.teamsService.query({ 'id.in': teamsId }).subscribe(teamsRes => {
                    this.achievedByTeams = teamsRes.body;
                });
            }
        });

        if (this.team) {
            this.teamsSkillsService.findAchievableSkill(this.team.id, this.skill.id).subscribe(skill => {
                this.achievableSkill = skill;
            });
        }

        this.levelService.query({ 'skillsId.in': this.skill.id }).subscribe(res => {
            this.neededForLevels = res.body;
        });

        this.badgeService.query({ 'skillsId.in': this.skill.id }).subscribe(res => {
            this.neededForBadges = res.body;
        });
    }

    onSkillInListChange(skillObjs) {
        this.achievableSkill = skillObjs.aSkill;
        this.skill = skillObjs.iSkill;
    }

    onSkillInListClicked(skillObjs) {
        this.achievableSkill = skillObjs.aSkill;
        this.skill = skillObjs.iSkill;
    }

    onToggleSkill(isActivated: boolean) {
        this.achievableSkill.achievedAt = isActivated ? moment() : null;
        this.updateSkill();
    }

    onToggleIrrelevance(irrelevant: boolean) {
        if (irrelevant) {
            this.achievableSkill.achievedAt = null;
        }
        this.achievableSkill.irrelevant = irrelevant;
        this.updateSkill();
    }

    updateSkill() {
        this.teamsSkillsService.updateAchievableSkill(this.team.id, this.achievableSkill).subscribe(
            (res: HttpResponse<IAchievableSkill>) => {
                this.achievableSkill = res.body;
                this.onSkillChanged.emit(this.achievableSkill);
            },
            (res: HttpErrorResponse) => {
                console.log(res);
            }
        );
    }

    skillAchieved() {
        return this.achievableSkill && !!this.achievableSkill.achievedAt;
    }

    isSameTeamSelected() {
        const selectedTeam = this.teamsSelectionService.selectedTeam;
        return selectedTeam && this.team && selectedTeam.id === this.team.id;
    }
}