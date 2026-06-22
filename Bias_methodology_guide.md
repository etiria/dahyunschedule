# 후향적 코호트에서 비뚤림(Bias) 회피 방법론 — 상세 해설 및 예시

부속문서 · 모(母)연구: 서울성모병원 KT 수혜자 H. pylori·위장관출혈·위암/대장암 1단계 연구
작성일: 2026-06-10 · 목적: 본 연구에서 마주칠 주요 비뚤림을 정의→발생기전→잘못된 예시→해결법(수치·코드 예시)으로 정리

---

## 0. 전체 지도 (어떤 비뚤림이, 왜 생기나)

| 비뚤림 | 본 연구에서의 발생 지점 | 주 해결법 |
|---|---|---|
| Immortal time bias | KT(time-zero)~제균 시작 사이의 "불멸기간" | 시간의존 노출 · landmark · target trial emulation(CCW) |
| Selection bias | HP **검사받은 사람만** 노출 분류 가능; 추적 손실; 유병사례 | restriction + IPSW · 다중대치 · new-user |
| Confounding by indication | 제균·내시경은 증상/궤양 있는 사람에게 시행 | 성향점수(IPTW/매칭) · active comparator · 음성대조 · E-value |
| Detection/surveillance bias | 이식·제균군이 내시경을 더 자주 → 더 발견 | 내시경 빈도 보정 · 결과 정의 강화 |
| Competing risk bias | 사망·이식신장소실이 암/출혈을 "막음" | 누적발생함수(CIF) · Fine-Gray |
| Misclassification(정보비뚤림) | 청구·코드 기반 노출/결과 오분류 | 검증된 정의 · 민감도분석 · 음성대조 |
| Lead-time/length bias | 암 감시로 조기·완만한 암을 더 포착 | 발생률 비교 · 임상적 유의사건 제한 |

**공통 원칙**: 분석 전에 **DAG(인과그래프)**를 그려 (a) 교란(공통원인)·(b) collider(공통결과, 조건화 금지)·(c) 중간매개를 구분하고, **target trial(가상의 이상적 RCT)**을 먼저 정의한 뒤 그것을 모방한다.

---

## 1. Immortal Time Bias (불멸시간 비뚤림)

### 1.1 정의·기전
추적 시작(time-zero)부터 **노출이 확정되는 시점까지의 기간** 동안 환자는 반드시 생존(혹은 무사건)해야 한다. 이 "불멸기간"을 노출군의 person-time으로 잘못 넣으면 노출군이 인위적으로 유리해진다.

**본 연구 예**: time-zero = KT일. "이식 후 제균을 받은 사람"을 제균군으로 분류하면, 제균을 받으려면 **그 시점까지 살아 있고 위장관 출혈/암이 없어야** 한다 → 제균군에 유리한 가짜 보호효과.

### 1.2 잘못된 분석 예시 (숫자로)
가상의 100명 KT 환자. 진실은 "제균은 출혈에 효과 없음(HR=1.0)".
- 제균은 평균 이식 후 **180일**에 시행. 출혈은 무작위로 발생.
- **Naive(ever/never) 분석**: 제균 받은 적 있으면 전체 추적을 제균군으로 계수.
  - 제균군의 첫 180일은 "출혈이 안 생긴 사람만 제균까지 도달" → 이 기간 출혈이 제균군 person-time에 면제됨.
  - 결과: 가짜 **HR ≈ 0.6**(제균이 출혈을 줄이는 것처럼). → **순전히 인공물.**

> 직관: "약을 받을 때까지 살아남은 시간"을 약의 공으로 돌리는 오류. (고전 사례: '오스카 수상자가 더 오래 산다' = 수상까지 살아남아야 함.)

### 1.3 해결법 A — 시간의존 노출 (time-varying exposure)
person-time을 **제균 전(비노출)**과 **제균 후(노출)**로 분할. 제균 전 기간의 출혈은 비노출군에 정확히 귀속.

```r
# tmerge로 시간의존 제균 변수 생성 (survival 패키지)
library(survival)
dt <- tmerge(base, base, id=id, tstop=fu_time)
dt <- tmerge(dt, erad_dates, id=id,
             eradicated = tdc(erad_day))     # 제균일 이후 1로 전환
fit <- coxph(Surv(tstart, tstop, bleed) ~ eradicated + age + sex, data=dt)
# -> 위 가상예에서 HR ≈ 1.0 으로 복원
```

### 1.4 해결법 B — Landmark 분석
고정 시점(예: 이식 후 **180일**)을 landmark로 정해, 그 시점까지의 제균 여부로 군을 나누고 **landmark 이후부터** 추적. landmark 이전 사건·사망자는 제외.
- 장점: 단순·직관적, 불멸기간을 잘라냄.
- 단점: landmark 이전 사건 정보 손실, landmark 시점 선택에 민감 → **6/12개월 등 여러 landmark로 민감도분석**.

```r
land <- subset(cohort, fu_time > 180)                 # landmark 생존자
land$grp <- ifelse(land$erad_day <= 180, "erad","no") # 180일까지의 제균 여부
land$t0  <- 180
coxph(Surv(t0, fu_time, bleed) ~ grp + age + sex, data=land)
```

### 1.5 해결법 C — Target Trial Emulation + Clone-Censor-Weight (CCW)
"이식 후 **유예기간(grace, 예 6개월) 내 제균 시작 vs 미시작**"이라는 **가상 RCT**를 정의하고 모방.
1. **Clone**: 각 환자를 두 전략(제균전략/비제균전략)에 **복제**해 배정(time-zero에 두 전략 모두와 양립).
2. **Censor**: 추적 중 자기 전략과 **어긋나는 순간**(예: 비제균전략인데 grace 내 제균함) **인위적 중도절단**.
3. **Weight**: 인위적 중도절단으로 생긴 선택을 **IPCW(역확률중도절단가중)**로 보정.
- 장점: 불멸시간·시점선택 문제를 **구조적으로 제거**, RCT와 직접 대응되는 추정치(per-protocol 효과).

```r
# 개념 코드 (요지): clone 2배 확장 -> 전략위반 시 artificial censoring -> IPCW
# (ipw / survival 로 분모=중도절단 안 받을 확률 모형화 후 가중 Cox)
```

### 1.6 주의
**감염상태 비교(HP− vs HP+ 미제균)**는 **baseline 노출**이라 불멸시간 문제 없음. 시간의존·CCW는 **제균 노출(G1 vs G2)**에만 적용한다.

---

## 2. Selection Bias (선택 비뚤림)

### 2.1 정의·종류
연구 대상/노출/결과의 **선택 과정**이 노출과 결과 모두에 연관될 때, 또는 **collider(공통결과)를 조건화**할 때 가짜 연관이 생긴다.
- (a) **Ascertainment(확인) 비뚤림**: HP **검사받은 사람만** 노출(HP+/−)을 알 수 있음 → 검사받음 여부가 selection.
- (b) **Loss to follow-up(추적 손실)**: 결과와 연관된 탈락.
- (c) **Prevalent user 비뚤림**: 이미 노출/질병 보유자만 포함(생존자 편향).

### 2.2 본 연구의 핵심: HP 검사 selection
HP 검사는 보통 **증상/내시경 받은 사람**에게 시행 → 검사군은 일반 KT 환자와 다름. "검사받음"이 **출혈·암(증상)과 HP 노출 둘 다에 연관**되면 collider가 되어 편향.

**DAG(단순화)**
```
증상/궤양 ──▶ HP검사받음(selection) ◀── (의사 결정)
   │                                  
   ▼                                  
 출혈/암   HP상태 ──▶ 출혈/암
```
"HP검사받음"으로 분석을 제한(=조건화)하면 증상↔HP 사이 가짜 경로가 열릴 수 있음.

### 2.3 해결법
1. **검사 시행률 선(先)확인 + 투명화**: CDW로 pre-KT 정규 EGD·HP 검사 시행률 산출. **정규 검사일수록 selection↓**. (이식 전 EGD가 표준이면 검사군≈전체 → 편향 작음.)
2. **Restriction**: 분석 코호트를 "HP 상태 확인자"로 명시하고, **확인자 vs 미확인자 특성 비교표**로 차이 정량화.
3. **IPSW(역확률선택가중)**: '검사받을 확률' 로지스틱 모형 → 가중치 1/P(검사)로 미확인자까지 대표성 복원.
   ```r
   ps_test <- glm(tested ~ age+sex+symptom+egd+comorbid, family=binomial, data=all)
   all$w_sel <- 1/predict(ps_test, type="response")    # 검사군에 적용
   ```
4. **다중대치(MI)**: HP 상태를 결측으로 보고 보조변수로 대치(m=20), 민감도분석.
5. **추적 손실**: 이식센터 장기추적 특성 기술 + **IPCW**로 정보성 중도절단 보정.
6. **New-user/active comparator**: 유병 노출자 배제로 prevalent-user 편향 차단.

### 2.4 작은 예시
검사군 출혈률 8% vs 전체 추정 5%인데, 검사군이 증상자 위주라면 8%는 과대. IPSW로 가중하면 모집단 추정 출혈률이 ~5%로 보정되고, HP 효과추정도 덜 편향됨.

---

## 3. Confounding by Indication (적응증 교란)

### 3.1 정의
치료(제균·내시경)가 **증상/궤양/위축 등 위험요인 때문에** 시행되면, 그 적응증이 노출과 결과의 공통원인이 되어 교란.

### 3.2 해결법과 예시
1. **Active comparator(능동 비교군)**: G1·G2 **모두 HP 양성**으로 두면 "HP 감염"이라는 큰 적응증이 양군에 공유되어 상쇄.
2. **성향점수(PS)**: 제균 확률을 공변량으로 모형화 → **IPTW** 또는 **매칭**.
   ```r
   ps <- glm(eradicated ~ age+sex+ulcer+atrophy+symptom+IS_regimen+charlson,
             family=binomial, data=hp_pos)
   hp_pos$ptw <- ifelse(hp_pos$eradicated==1, 1/fitted(ps), 1/(1-fitted(ps)))
   # 가중 후 공변량 균형은 표준화평균차(SMD)<0.1 로 확인
   library(cobalt); bal.tab(eradicated ~ ..., data=hp_pos, weights=hp_pos$ptw)
   coxph(Surv(t0,t1,bleed) ~ eradicated, data=hp_pos, weights=ptw)
   ```
   - **SMD(표준화평균차)**: |평균차|/합동표준편차. <0.1이면 균형 양호. (p값 대신 SMD 사용.)
3. **음성대조(negative control)**: 제균과 인과적으로 무관해야 할 결과(예: 외상)나 노출로 잔여교란 점검 — 거기서 효과가 보이면 교란 의심.
4. **E-value**: 관측된 HR를 "설명해 없애려면" 미측정 교란이 노출·결과와 각각 얼마나 강해야 하는지(최소 위험비). 예: HR=0.6 → **E-value≈2.7** (RR 2.7 이상의 미측정 교란이 있어야 결과가 뒤집힘) → 견고성 정량화.

---

## 4. Detection / Surveillance Bias (발견·감시 비뚤림)

### 4.1 기전
이식군·제균군은 정기 내시경을 더 자주 받아 **무증상 암·출혈을 더 많이 발견** → 노출이 결과를 "늘리는" 것처럼(또는 조기발견으로 예후 좋아 보이게) 왜곡.

### 4.2 해결법
- **감시 강도 보정**: 내시경(EGD/대장내시경) **횟수**를 공변량/오프셋으로 포함.
- **결과 정의 강화**: 무증상 우연발견 대신 **임상적으로 유의한 사건**(수혈 필요 출혈, 침습성/증상성 암)으로 제한 민감도분석.
- **동일 감시 하위집단 분석**: 비슷한 내시경 빈도군 내 비교.

### 4.3 예시
제균군이 연 1.5회, 미제균군 0.7회 내시경. 보정 없이는 제균군에서 위암 "더 발견" → 보정 후 효과 약화/소실 여부로 detection bias 판단.

---

## 5. Competing Risk Bias (경쟁위험)

### 5.1 기전
KT 환자는 **사망·이식신장소실**이 흔하다. 사망하면 이후 위암·출혈이 발생할 수 없으므로(경쟁사건), 표준 **Kaplan-Meier(1−KM)**는 누적발생을 **과대추정**한다.

### 5.2 해결법: 누적발생함수(CIF) + Fine-Gray
- **원인별 위험(cause-specific Cox)**: 병인 기전 해석에 적합.
- **부분분포 위험(Fine-Gray, SHR)**: 실제 누적발생(예측) 해석에 적합. 둘을 **병행 보고**.
```r
library(cmprsk)
# status: 0=중도절단,1=위암,2=사망(경쟁)
cif <- cuminc(ftime=t, fstatus=status, group=erad)        # CIF
fg  <- crr(ftime=t, fstatus=status, cov1=X, failcode=1, cencode=0)  # Fine-Gray SHR
```

### 5.3 예시 (왜 중요한가)
10년 위암: 1−KM = 4.0% (사망을 무시) vs CIF = 2.5% (사망 경쟁 반영). 사망이 많은 이식군에서 차이가 커짐 → **CIF/Fine-Gray가 정직한 수치**.

---

## 6. Misclassification / Information Bias (오분류)

- **노출 오분류**: 청구/코드 기반 제균 정의 부정확 → 대개 **비차별적(non-differential)**이면 효과를 **null로 희석**(보수적). 차별적이면 방향 불명.
- **결과 오분류**: 위암을 코드만으로 잡으면 거짓양성↑ → **병리확진 + 중증등록(V코드) 복합정의**로 PPV↑.
- **해결**: 검증된 조작적 정의(제균 Park 2023 민감도 99.7%, 위암 Yang 2022 PPV 94.1%), 정의 바꿔가며 민감도분석, **음성대조**.

---

## 7. Lead-time / Length Bias (암 결과 특이)

- **Lead-time**: 감시로 조기 진단하면 "발생부터 사망까지"가 길어 보이는 착시 → **생존 비교가 아닌 발생률 비교**로 회피.
- **Length bias**: 천천히 자라는 암이 감시에 더 잘 잡힘 → 침습/증상성 결과 제한, 발생률 중심 해석.

---

## 8. 통합 분석 워크플로(권고 순서)

1. **DAG 작성** → 교란/collider/매개 구분, 조정변수 집합 결정(백도어 기준).
2. **Target trial 정의** → 적격·time-zero·전략·결과·추적·인과추정량(per-protocol/ITT) 명시.
3. **노출 분리**: 감염상태(baseline) vs 제균(시간의존).
4. **불멸시간 차단**: 시간의존 + landmark + CCW 병행.
5. **선택 보정**: restriction + IPSW/MI(+추적손실 IPCW).
6. **교란 보정**: active comparator + PS(IPTW/매칭, SMD<0.1).
7. **경쟁위험**: CIF + Fine-Gray.
8. **감시/오분류**: 내시경빈도 보정·정의 강화.
9. **견고성**: lag, 음성대조, **E-value**, 다양한 민감도분석.
10. **보고**: STROBE/RECORD-PE + 참여자 흐름도 + SMD 균형표.

---

## 9. 한 장 요약표

| 단계 | 도구 | 산출/점검 |
|---|---|---|
| 설계 | DAG, target trial emulation | 조정변수·time-zero·전략 |
| 불멸시간 | tmerge 시간의존 / landmark / CCW(IPCW) | 동일결론 수렴 확인 |
| 선택 | restriction + IPSW / MI | 확인자 vs 미확인자 표 |
| 교란 | PS-IPTW/매칭, active comparator | SMD<0.1, E-value |
| 감시 | 내시경빈도 보정, 결과강화 | 보정 전후 HR |
| 경쟁위험 | CIF, Fine-Gray(SHR) | 1−KM과 비교 |
| 오분류 | 검증된 정의, 음성대조 | 민감도분석 |

---

### 참고(방법론)
- Hernán MA, Robins JM. *Am J Epidemiol* 2016 — Target trial emulation.
- Suissa S. *Am J Epidemiol* 2008 — Immortal time bias in observational studies.
- Hernán MA, et al. *Epidemiology* 2004 — Selection bias / colliders (structural).
- VanderWeele TJ, Ding P. *Ann Intern Med* 2017 — E-value.
- Austin PC, Fine JP. *Stat Med* 2017 — Competing risks (Fine-Gray) 실무.
- Maringe C, et al. *Int J Epidemiol* 2020 — Clone-censor-weight 적용 예.

> 면책: 교육·설계 보조 문서. 코드는 개념 예시이며 실제 변수·자료구조에 맞춰 검증·수정 후 사용할 것. 통계전문가 검토 권고.
