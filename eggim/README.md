# EGGIM 자동 산출 파이프라인 (PoC 스캐폴드)

내시경 이미지 뭉치를 던지면 → **필요한 부위 이미지를 골라내고** → **각 부위의 IM 등급을 판별**해서 → **EGGIM 점수(0–10)를 계산**하는 3단계 파이프라인의 개념증명(PoC) 코드입니다.

```
환자 1명의 내시경 이미지 폴더
        │
        ▼
 ① SiteClassifier ──▶ 5개 EGGIM 부위 중 어디인가? + 화질 적정성 게이트
        │             (해당없음/저화질 이미지는 여기서 탈락)
        ▼
 ② IMGrader       ──▶ 그 부위의 장상피화생(IM) 등급 0 / 1 / 2
        │
        ▼
 ③ compute_eggim  ──▶ 부위별 대표등급 합산 → EGGIM (5부위 미충족 시 '불완전' 플래그)
```

## EGGIM 정의 (코드에 고정된 임상 상수)

- **5부위**: 전정부 소만·대만, 각부, 체부 소만·대만
- **부위별 등급**: 0(IM 없음) / 1(국소, ≤30%) / 2(광범위, >30%)
- **총점**: 0–10, **≥5 = 고위험** (광범위 IM / 고단계 OLGIM과 상관)
- 5부위 중 하나라도 평가 불가 → 총점을 확정하지 않고 **하한값 + 불완전 플래그**로 보고 (부분 점수를 확정 점수로 오인하지 않도록)

## 구성

| 파일 | 역할 | 의존성 |
|---|---|---|
| `eggim/config.py` | 임상 상수·부위 정의·설정 | 표준 라이브러리 |
| `eggim/aggregate.py` | **EGGIM 집계 로직 (핵심·결정론적)** | 표준 라이브러리 |
| `eggim/metrics.py` | QWK, within±1, 고위험 민감도/특이도 | 표준 라이브러리 |
| `eggim/models.py` | SiteClassifier / IMGrader (timm 백본) | torch, timm |
| `eggim/data.py` | 데이터셋, **환자단위 분할**, 합성 매니페스트 | torch(선택) |
| `eggim/train.py` | 두 모델 학습 루프 | torch |
| `eggim/pipeline.py` | 폴더 → EGGIM end-to-end 추론 | torch |
| `labeler/index.html` | **부위·화질·IM등급 라벨링 도구** (브라우저, 로컬 처리) | 없음 |
| `demo.py` | GPU/torch 없이 전체 흐름 시연 | 표준 라이브러리 |
| `tests/test_aggregate.py` | 집계 로직 단위테스트 (10건) | 표준 라이브러리 |

**설계 원칙**: 임상적으로 중요한 **집계·리포트 로직은 딥러닝 스택과 분리**되어 있어, torch 없이도 검증·감사가 가능합니다.

## 지금 바로 실행 (데이터·GPU 불필요)

```bash
cd eggim
python3 tests/test_aggregate.py   # 집계 로직 단위테스트 (10/10)
python3 demo.py                    # 200명 가상 코호트로 필터→등급→집계→리포트 시연
```

`demo.py`는 정답 라벨에 노이즈를 주입해 "불완전한 모델"을 흉내 낸 뒤, 실제 프로덕션 집계 함수(`compute_eggim`)로 EGGIM을 산출하고 전문가 EGGIM과 비교합니다. (숫자는 주입 노이즈의 산물일 뿐, 실제 성능이 아닙니다 — 배관이 맞물려 도는지를 증명하는 용도.)

## 부위 태깅이 없을 때 — 부트스트랩 워크플로우 (권장)

20만 장을 사람이 다 분류하지 마세요. 시드 소량만 태깅하고 모델로 나머지를 사전분류한 뒤 검수합니다.

```
1) 매니페스트 스캐폴드   python -m eggim.scaffold_manifest /data/studies --out manifest.csv
2) 시드 라벨링           labeler/index.html 로 환자 100~200명 × ~10장 부위/화질 태깅 (~1,500~2,000장)
                         └ 부위는 순수 이미지 겉모습으로 판단 (촬영 순서는 환자마다 달라 신뢰 불가)
3) 부위분류기 학습        python -m eggim.train site --manifest manifest.csv --out ckpt/site.pt
4) 나머지 자동 사전분류    site 모델로 20만 장에 site/confidence 부여
5) 사람은 검수만          확신 높은 건 통과, 애매한 것만 교정 (active learning)
6) IM 등급 라벨링 → grade 모델 학습
```

핵심: **"무에서 20만 장 분류"가 "2천 장 태깅 + 나머지 교정"으로** 줄어듭니다.

### 부위분류기의 핵심 난제 — 소만 vs 대만

부위 분류에서 **전정부/각부/체부(region)** 구분은 쉽지만, **같은 부위의 소만 vs 대만(curvature)** 구분은
정지 이미지 한 장만으로는 사람도 어렵습니다(내비게이션 맥락 부재). 이 오차가 그대로 EGGIM 점수 오차로 전파됩니다.

- `metrics.site_error_breakdown()` 로 오차를 **region 오분류 vs curvature-only 오분류**로 분리해 진단하세요.
- curvature 정확도가 낮으면 → 2단계(region→curvature) 분류, 다중 프레임 활용, 또는 축약형 EGGIM으로 전략 조정.
- `config.SITE_TO_REGION` / `REGIONS` 로 coarse 라벨을 얻을 수 있습니다.

## 실제 데이터로 학습하기 (원내 보안환경 권장)

```bash
pip install -r requirements.txt
# 1) 매니페스트 준비: image_path, patient_id, site, quality_ok, im_grade 컬럼의 CSV
python -m eggim.train site  --manifest data/manifest.csv --out ckpt/site.pt
python -m eggim.train grade --manifest data/manifest.csv --out ckpt/grade.pt
```

```python
from eggim.pipeline import EggimPipeline
pipe = EggimPipeline("ckpt/site.pt", "ckpt/grade.pt")
result = pipe.score_folder("/path/to/patient_study")
print(result.summary())          # 예: EGGIM=6/10 (HIGH risk) [antrum_lesser=2, ...]
```

### 매니페스트 스키마

| 컬럼 | 값 | 비고 |
|---|---|---|
| `image_path` | 파일 경로 | |
| `patient_id` | 환자 식별자 | **분할 누수 방지에 필수** |
| `site` | `antrum_lesser` / `antrum_greater` / `incisura` / `corpus_lesser` / `corpus_greater` / `other` | |
| `quality_ok` | 0/1 | 화질·적정성 |
| `im_grade` | 0/1/2 또는 공란 | 부위-라벨만 있는 데이터는 공란 |

## 실제 개발에 앞서 확보해야 할 것 (정직한 전제)

이 스캐폴드는 **모델 구조·학습·집계·평가의 배관**을 제공합니다. 실제 성능은 다음 라벨 품질에 좌우됩니다:

1. **부위 태깅** — 이미지가 어느 해부학적 부위인지. 없으면 SiteClassifier 학습용 라벨을 먼저 만들어야 함.
2. **광학 모드** — EGGIM은 NBI/BLI 등 virtual chromoendoscopy 전제. 백색광만 있으면 등급 신뢰도 저하.
3. **정답 라벨** — 전문가 EGGIM 또는 (하위표본) 조직학 OLGIM. 지도학습의 상한선.
4. **판독자 간 신뢰도** — 라벨 자체의 κ/ICC를 보고해야 모델 성능의 의미가 생김.

## 보고·검증 권고

- 환자단위 train/val/test 분할(코드에 강제) + **외부검증 코호트**
- 지표: 부위 분류 AUROC, IM 등급 QWK, 환자 EGGIM ICC/QWK, EGGIM≥5 민감도·특이도, **calibration**
- TRIPOD-AI / STARD-AI 준수, 사전 프로토콜 등록

> 이 코드는 연구 개발용 PoC이며 의료기기가 아닙니다. 임상 사용 전 규제·검증 절차가 필요합니다.
