# 면역억제제 복용 환자에서 H. pylori 제균 여부에 따른 위암 발생 차이
## — 선행연구 종합 및 대규모 실제임상데이터 검증 연구계획서 (초안)

작성일: 2026-06-09 · 작성 목적: 연구 착수를 위한 근거 정리 및 프로토콜 설계

---

## 0. 핵심 요약 (Executive Summary)

- **확립된 근거 ①**: 일반(면역정상) 인구에서 *H. pylori* 제균은 위암 발생을 약 **45~55% 감소**시킨다 (RCT·메타분석 일관). 단, 근거의 대부분이 동아시아 고위험 인구에서 나옴.
- **확립된 근거 ②**: 만성 면역억제 상태(특히 고형장기이식)는 위암 위험을 **약 1.7~2.3배** 높이며, 위암은 *H. pylori* 매개 **"감염관련 암"**으로 분류된다.
- **상충/미해결**: IBD 환자에서는 *H. pylori* 유병률이 오히려 **낮고** 위암도 증가하지 않는다(때로 감소). 면역억제가 *H. pylori* 위염→위축→암(Correa cascade)을 가속하는지 약화시키는지는 **인체 데이터로 입증되지 않았다.**
- **연구 공백(핵심 기회)**: **"면역억제제 사용자에서 제균 vs 비제균에 따른 위암(선암) 발생 차이"를 직접 다룬 연구는 존재하지 않는다.** 기존 제균-위암 근거는 모두 면역정상 인구 기반이며 면역억제 상태를 층화하거나 보고하지 않았다.
- **권고 설계**: 한국 **NHIS(국민건강보험공단) 국가검진코호트(HEALS) 또는 맞춤형 NHID** 기반 **후향적 코호트**. 면역억제제 노출 코호트 내에서 제균군 vs 비제균군을 비교. **시간의존 노출 + landmark + 경쟁위험 + 성향점수**로 핵심 비뚤림(immortal time, detection, confounding by indication)을 통제. **대만 NHIRD / OMOP(FEEDER-NET)**로 복제 검증.

---

# PART 1. 선행연구 종합 정리

## 1.1 일반 인구에서 H. pylori 제균의 위암 예방 효과 (강한 근거)

| 연구 | 설계/인구 | 핵심 결과 | 출처 |
|---|---|---|---|
| **Li WQ et al. 2019, BMJ** (Shandong/Linqu 중재연구) | 2×2×2 factorial RCT, 고위험 주민 3,365명, 22.3년 추적 | 위암 발생 **OR 0.48 (95% CI 0.32–0.71)**; 위암 사망 **HR 0.62 (0.39–0.99)** | [PMC6737461](https://pmc.ncbi.nlm.nih.gov/articles/PMC6737461/) · 26.5년 업데이트 [Gastroenterology 2022](https://www.gastrojournal.org/article/S0016-5085(22)00338-9/fulltext) |
| **Ford AC et al. 2020, Cochrane** | 7 RCT, 무증상 감염자 8,323명 | 위암 발생 **RR 0.54 (0.40–0.72)**; 사망 **RR 0.61 (0.40–0.92)**; NNT≈72, 중등도 확실성 | [PMC7389270](https://pmc.ncbi.nlm.nih.gov/articles/PMC7389270/) |
| **Lee YC et al. 2016, Gastroenterology** | RCT+코호트 풀링, 48,064명/340,255 PY | 전체 **IRR 0.53 (0.44–0.64)**; 무증상 **0.62**; 내시경절제후 **0.46** | [PMID 26836587](https://pubmed.ncbi.nlm.nih.gov/26836587/) |
| **Fukase K et al. 2008, Lancet** | 조기위암 내시경절제후 RCT, 544명 | 이시성 위암 **HR 0.339 (0.157–0.729)** | [PMID 18675689](https://pubmed.ncbi.nlm.nih.gov/18675689/) |
| **Choi IJ et al. 2018, NEJM** (한국) | 내시경절제후 이중맹검 RCT, 396명 | 이시성 위암 **HR 0.50 (0.26–0.94)**; 체부 위축 호전 48.4% vs 15.0% | [PMID 29562147](https://pubmed.ncbi.nlm.nih.gov/29562147/) |
| **Choi IJ et al. 2020, NEJM** (한국) | 위암 가족력자 이중맹검 RCT, 1,676명, 9.2년 | 위암 **HR 0.45 (0.21–0.94)**; 제균 확인자 **HR 0.27 (0.10–0.70)** | [PMID 31995688](https://pubmed.ncbi.nlm.nih.gov/31995688/) |
| **Liou JM et al. 2021, Gut** (대만 Matsu 대량제균) | 지역사회 코호트, 유병률 64%→15% | 위암 발생 **53% 감소** (CI 30–69%); 사망 25%↓(NS) | [PMC7815911](https://pmc.ncbi.nlm.nih.gov/articles/PMC7815911/) |

**가이드라인**: Maastricht VI/Florence(2022), Kyoto global consensus(2015), Taipei global consensus(2020), IARC(NEJM 2024) 모두 *H. pylori*를 명확한 발암인자로 보고 **감염자 전원 제균** 및 고위험 지역의 screen-and-treat를 권고. 위축/장상피화생 발생 **이전** 제균이 가장 효과적("point of no return").

**한계/주의**: ① 근거 대부분이 동아시아 고발생 인구 → 서구 저발생 인구 외삽 불확실. ② 사망 종점은 검정력 부족(CI 넓음). ③ 관찰연구는 healthy-screenee 선택비뚤림.

## 1.2 면역억제 상태와 H. pylori·위염·발암 (근거 빈약·상충)

- **IBD에서 H. pylori 유병률은 낮음(일관)**: Luther 2010 메타분석 RR **0.64 (0.54–0.75)**(크론 0.60, 궤양성대장염 0.75); 2026 업데이트 OR **0.43 (0.35–0.53)**. 원인(5-ASA/설파살라진의 항균효과 vs 과거 항생제 노출 vs 면역·미생물총 차이)은 미해결. ([PMC4865406](https://pmc.ncbi.nlm.nih.gov/articles/PMC4865406/), [PMC12910842](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12910842/))
- **IBD에서 위암은 증가하지 않음(때로 감소)**: 한국 전국 코호트(궤양성대장염) 위암 **HR 0.60 (0.47–0.77)**. ([PMC10141013](https://pmc.ncbi.nlm.nih.gov/articles/PMC10141013/)) — IBD 관련 암 증가는 주로 소장·대장.
- **스테로이드는 H. pylori 정착을 악화시키지 않음(동물)**: Hocking 1999 — 세균 부하 유사. 내인성 글루코코르티코이드가 Helicobacter 위염을 "완화"한다는 기전 데이터(2025 preprint, 비심사). **주의**: 면역억제가 조직학적 활동성 위염 소견을 *가려* 진단 수율을 낮출 수 있음. ([PMID 10588046](https://pubmed.ncbi.nlm.nih.gov/10588046/))
- **MTX·azathioprine의 위 Correa cascade·위암에 대한 양질의 인체 데이터 없음** → 입증된 null이 아니라 **공백**.
- **항-TNF 저항성과 H. pylori 연관**(강직성척추염, 2025) 보고 있으나 위암 신호는 미연구.
- **제균 성공률**: 신이식 후보(요독·면역억제 동반)에서 제균률 **48.5%**로 낮은 보고(단, 1일1회 부적정 용법 교란). 면역억제군 vs 정상군 head-to-head 비교 없음. ([PMC9269173](https://pmc.ncbi.nlm.nih.gov/articles/PMC9269173/))

## 1.3 면역억제제 사용자(특히 이식)의 위암 위험 자체 (중등도 근거)

| 연구 | 인구 | 위암 위험 | 출처 |
|---|---|---|---|
| Engels EA et al. 2011, JAMA | 미국 이식 175,732건 | 위암 **SIR 1.67 (1.42–1.96)**; 위암을 **감염관련 암**으로 분류 | [PMID 22045767](https://pubmed.ncbi.nlm.nih.gov/22045767/) |
| Wang Y et al. 2018, Oncotarget | 신이식 메타분석 79,988명 | 위암 **SIR 1.93 (1.60–2.34)** | [Oncotarget](https://www.oncotarget.com/article/23841/text/) |
| Jeong S et al. 2020, Sci Rep (한국) | 신이식 9,915명 | 위암 **SIR 2.3 (1.9–2.8)**; 전체암 SIR 3.9 | [PMC7722878](https://pmc.ncbi.nlm.nih.gov/articles/PMC7722878/) |

- **약제별**: azathioprine(피부암 위주 직접 발암), calcineurin inhibitor(DNA복구 억제·TGF-β1↑ 기전), **sirolimus는 피부암엔 보호적이나 위암 보호는 미입증**(NMSC 제외 시 IRR 1.06). ([PMC4567030](https://pmc.ncbi.nlm.nih.gov/articles/PMC4567030/))
- **기전**: 면역억제 → 면역감시 저하 → **감염관련 암(EBV, HHV-8, HPV, HBV/HCV, *H. pylori*→위암)** 상승. 단 위암 상승폭은 바이러스성 암보다 훨씬 작음.
- **이식 수혜자의 H. pylori 상태↔위암 직접 연결은 미입증**(유병률은 오히려 낮을 수 있음) → 공백.
- **분류 주의**: 위 MALT 림프종(전형적 *H. pylori* 연관)은 WHO상 PTLD에서 **제외**(EBV+ 변연부림프종 제외) → 위 림프계 악성은 이질적이므로 본 연구는 **선암(C16)**에 집중 권고.

## 1.4 연구 공백 (Research Gap) — 본 연구의 정당성

> **"면역억제제 복용/면역억제 상태에서 H. pylori 제균 여부에 따른 위(선)암 발생 차이"를 직접 다룬 연구는 확인되지 않음.**

- 기존 제균-위암 RCT/코호트(홍콩 ~73,000, 미국 VHA ~371,813, 일본 풀링)는 면역억제 상태를 **보고·층화하지 않음**.
- 가장 가까운 연구도: (a) 이식 후보의 제균률/합병증만(암 종점 없음, [PMC9269173](https://pmc.ncbi.nlm.nih.gov/articles/PMC9269173/)), (b) 선암 아닌 **MALT 림프종**, (c) IBD 제균 결정 논의(암 발생 분석 없음, [Front Med 2026](https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2026.1757356/full)).
- 가이드라인의 면역억제 환자 제균 권고(이식 전, 생물학제제 전)는 모두 **일반인구 근거의 외삽** + 궤양/림프종 우려 기반.

**임상적 의의**: 면역억제군은 (i) 위암 기저위험이 높고, (ii) 제균 효과의 방향·크기가 불확실하며, (iii) 제균이 면역억제 약물(azathioprine/MTX/biologics)과 상호작용(PPI 등)할 수 있어, **이 인구에 특화된 근거가 임상결정(면역억제 시작 전 screen-and-treat 여부)에 직접 기여**할 수 있다.

---

# PART 2. 대규모 데이터 검증 연구계획서 (초안)

## 2.1 연구 질문 및 가설

- **연구질문 (PICO)**
  - **P**: 면역억제제를 신규 개시한 성인 환자
  - **I**: *H. pylori* 제균치료 시행(성공)
  - **C**: 제균치료 미시행(또는 미성공)
  - **O**: 위선암(ICD-10 C16) 신규 발생
- **주 가설(H1)**: 면역억제제 사용자에서 *H. pylori* 제균군은 비제균군보다 위암 발생이 낮다 (HR < 1).
- **탐색적 가설**: 효과크기가 면역억제 종류(스테로이드/MTX/티오퓨린/CNI/biologics)·강도·기간, 그리고 일반인구 대비 차이가 있는가 (effect modification).

## 2.2 연구 설계

- **후향적 코호트** (active-comparator, **new-user design**). 가능하면 **target trial emulation** 프레임으로 설계해 immortal time·선택비뚤림을 구조적으로 차단.
- **2단계 비교**:
  1. *주 분석* — **면역억제제 신규 사용자 코호트** 내에서 제균 vs 비제균.
  2. *효과수정 분석* — 동일 설계를 **면역억제 비사용자(매칭 일반인구)**에도 적용해 제균효과의 상대크기를 면역억제 유무로 비교(상호작용항).

## 2.3 데이터 소스 (권고: NHIS 1차, 대만 NHIRD/OMOP 복제)

| 소스 | 강점 | 약점 | 본 연구 적합성 |
|---|---|---|---|
| **NHIS 국가검진코호트(HEALS, ~51만)** | 검진 공변량(BMI·흡연·음주·공복혈당·지질) 포함, 40–79세, 암 종점 가능 | 40세 이상·표본, 희귀노출 검정력 | **1차 권고**(공변량 확보 시) |
| **NHIS 맞춤형 NHID(전국민)** | 검정력 최대, 약제·진단·검진 연계 | KCCR 직접연계 제한·온사이트 분석, 검진 공변량은 검진수검자만 | 검정력 필요 시 1차 |
| 대만 NHIRD | 전국민, **암등록(병기 포함)** 연계 | BMI·흡연 없음, 자비진료 누락 | **복제 코호트(병기 추가)** |
| OMOP/FEEDER-NET·HIRA K-OMOP | 다기관·국제 표준 복제 | 맞춤연계 약함 | 표준 phenotype 복제 |
| CPRD(UK) | 1차의료 공변량 풍부 | 서구 저발생·다른 진료관행 | 대조인구 민감도분석만 |

출처: NHID 프로파일 [Seong 2017](https://academic.oup.com/ije/article/46/3/799/2418193), HEALS [PMID 28947447](https://pubmed.ncbi.nlm.nih.gov/28947447/), 접근 [NHISS](https://nhiss.nhis.or.kr) / [JKMS 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11876782/), 대만 NHIRD [profile](https://www.e-epih.org/journal/view.php?doi=10.4178/epih.e2018062), OMOP [PMC9742390](https://pmc.ncbi.nlm.nih.gov/articles/PMC9742390/).

## 2.4 조작적 정의 (Operational Definitions)

### (1) 면역억제제 노출 — ATC L04 중심
- 전신스테로이드 **H02AB**, MTX **L04AX03**, azathioprine **L04AX01**, CNI **L04AD**(ciclosporin/tacrolimus), mycophenolate/mTOR **L04AA**, TNF억제제·biologics **L04AB/AC/AG**. (WHO [ATC L04](https://atcddd.fhi.no/atc_ddd_index/?code=L04&showdescription=yes))
- **신규 사용자**: 정의 이전 **1년 이상 washout**(해당 약제 무처방).
- **만성/현재 노출**: 일정 기간 내 최소 처방수·투약일수 + **유예기간(grace 30–90일)**으로 연속 치료 episode 정의. 스테로이드는 **프레드니솔론 환산 누적용량(g)**으로 범주화. **시간의존 공변량**으로 모델링.
- *주의(불확실)*: 누적용량·grace 임계값은 표준이 없는 연구별 관행 → 사전명시 + 민감도분석.

### (2) H. pylori 제균 — Park CH 2023 검증 알고리즘 사용
- 제균 = **PPI + 2개 적격 항생제** 단일 처방(표준삼제 PPI+amoxicillin+clarithromycin 등 6개 조합 + bismuth 사제/순차·동시). 2차 = 1차 후 ≥28일.
- **제균 성공**: 치료 후 21일~6개월 확인검사(요소호기/대변항원/신속요소분해효소) 기록 + 구제요법 없음.
- 검증 성능: 치료 식별 민감도 99.7%; 성공 판정 민감도 97.6%/특이도 91.4%(1차). 출처 [PMC10477078](https://pmc.ncbi.nlm.nih.gov/articles/PMC10477078/).

### (3) 위암 결과 — 고특이도 복합정의
- ICD-10 **C16** + 한국 **중증등록 V193/V194**(본인부담경감) ± 위절제/내시경절제 시술코드.
- 검증: "1년내 C-code 외래 ≥3 또는 입원 ≥1" 알고리즘 위암 **민감도 96.0%, PPV 94.1%**(vs KCCR). 출처 [Yang 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9016317/).
- 기준시점 **clean look-back(예: 2년)**으로 유병암 제외, **신규(incident)**만.

### (4) 공변량
- 인구학(연령·성·소득분위·지역), 흡연·음주·BMI(검진), 위암 가족력(가능 시), 동반질환(Charlson, 당뇨, 위축성위염/장상피화생, 소화성궤양, 만성신부전, 자가면역질환), PPI·NSAID·aspirin 사용, **내시경 수검 빈도(detection bias 보정)**, 면역억제 적응증(confounding by indication 보정).

## 2.5 통계 분석

- **주 분석**: 제균(시간의존) → 위암까지 시간. **Cox 비례위험** + **시간의존 공변량**. 추가로 **Landmark 분석**(예: 1년 landmark)으로 immortal time 차단.
- **경쟁위험**: 사망을 경쟁사건으로 한 **Fine-Gray subdistribution hazard**(SHR) 병행.
- **교란 통제**: **성향점수(PS)** — 제균 확률에 대한 IPTW 또는 매칭; 또는 high-dimensional PS. active-comparator/new-user로 보강.
- **잠복기(lag)**: 노출 후 첫 **1~3년 위암 제외** 민감도분석(역인과·예진단 배제).
- **효과수정**: 면역억제 유무·종류·누적용량 층화 및 상호작용항.
- **민감도/음성대조**: 제균 정의(성공 확인 한정), washout·grace 길이, V-code 유무, 음성대조 결과(예: 제균과 무관할 암종)로 잔여교란 점검.

## 2.6 표본수·검정력 (개략)

- 가정: 면역억제 코호트에서 비제균군 10년 위암 누적발생 ~1.5–2.5%(이식 SIR 2×, 일반 위험 반영), 검출하려는 **HR 0.6**, 양측 α=0.05, power 0.8.
- 위 가정에서 필요 사건수 대략 **≈200건 내외**, 이를 위해 제균:비제균 ≈1:2~1:3, **수만~십수만 명** 규모가 필요 → NHIS 전국민/대규모 코호트로 충분히 도달 가능(검진코호트로 부족 시 맞춤형 NHID).
- *주*: 정확한 수치는 실제 기저발생률·추적기간·노출분율 확정 후 시뮬레이션으로 산출(프로토콜 lock 전 재계산).

## 2.7 한계 및 비뚤림 (사전 인지)

- **Immortal time bias** → 시간의존 노출 + landmark + target trial emulation.
- **Detection/surveillance bias**(면역억제·제균군이 내시경 多) → 내시경빈도 보정, 진행성/증상성 결과 제한 민감도분석.
- **Confounding by indication**(제균=궤양/위축, 면역억제=자가면역질환 자체 위험) → 적응증 보정·PS·active comparator.
- **노출 오분류**(청구=조제, 복약·OTC·자비 누락) → 보통 null 방향(보수적).
- **핵심 공변량 결손**(흡연·BMI·가족력·혈청형) → 검진코호트 연계 또는 병원 EMR/등록 검증암으로 보완.
- **KCCR 직접연계 제한** → C16+V193 청구정의로 대체 가능하나, 맞춤형 build 필요 여부 사전 확인.

## 2.8 윤리 및 거버넌스

- 2차 자료(비식별) 후향연구 → **IRB 심의(심의면제 가능성)** + NHIS 자료이용 심사.
- 분석은 NHIS 지정 분석센터 온사이트(맞춤DB) 또는 표본연구DB 원격. 결과는 집계치만 반출.
- 자금·이해상충·데이터관리계획 명시. 보고는 **STROBE / RECORD-PE** 가이드라인 준수.

## 2.9 제안 타임라인 (개략)

1. **0–2개월**: 프로토콜 확정, phenotype 사전명시, IRB·NHIS 신청 (심사 ~25일+).
2. **3–5개월**: 데이터 수령·구축, 코호트·노출·결과 도출 및 내부검증.
3. **6–9개월**: 주분석·민감도분석.
4. **10–12개월**: 대만 NHIRD/OMOP 복제, 원고 작성(STROBE/RECORD-PE).

---

## 참고: 사전 확인 필요사항 (프로토콜 lock 전)
1. **KCCR 연계 필요성** — 표본코호트엔 미동봉. C16+V193로 충분한지 vs 맞춤형 build(비용·기간↑) 결정.
2. **면역억제 누적용량·grace 임계값** — 검증된 한국 표준 부재 → 사전명시 + 민감도분석.
3. **제균 "성공" 정의를 노출로 쓸지** — 2차 제균 성공판정 특이도 낮음(54.8%) 주의.

---

### 주요 출처 (대표)
- 일반인구 제균-위암: [Cochrane 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7389270/), [Lee 2016](https://pubmed.ncbi.nlm.nih.gov/26836587/), [Shandong/BMJ 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6737461/), [Choi NEJM 2018](https://pubmed.ncbi.nlm.nih.gov/29562147/)·[2020](https://pubmed.ncbi.nlm.nih.gov/31995688/), [대만 Matsu/Gut 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7815911/)
- 면역억제·이식 발암: [Engels JAMA 2011](https://pubmed.ncbi.nlm.nih.gov/22045767/), [Wang Oncotarget 2018](https://www.oncotarget.com/article/23841/text/), [Jeong Sci Rep 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7722878/)
- 면역억제·HP·IBD: [Luther 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC4865406/), [IBD 위암/한국 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10141013/), [이식후보 제균 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9269173/)
- 데이터·정의: [NHID profile 2017](https://academic.oup.com/ije/article/46/3/799/2418193), [HEALS](https://pubmed.ncbi.nlm.nih.gov/28947447/), [제균 정의 Park 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10477078/), [위암 정의검증 Yang 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9016317/)

> 면책: 본 문서는 연구 기획 보조 자료입니다. 인용 수치는 출처 초록/원문 기준으로 정리했으나, 일부 NEJM 본문은 접근 제한으로 PubMed 초록의 동일 수치를 교차확인했습니다. 프로토콜 확정 전 원문 재확인 및 통계전문가·NHIS 자료담당 검토를 권고합니다.
