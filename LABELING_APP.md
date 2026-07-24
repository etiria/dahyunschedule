# EGGIM 다중전문가 라벨링 웹앱

내시경 검사에 대해 **① 위치(localization) · ② Kimura-Takemoto · ③ EGGIM**를 여러 전문가가
각자 라벨링하고, 판독자간 일치도(κ)와 합의 정답을 만들기 위한 웹 도구입니다. 이 Next.js 앱에
`/label` 경로로 포함되어 있으며, 클라우드 VM에 자체 호스팅합니다. **이미지는 서버 로컬 디스크에서만
서비스**되고 외부로 나가지 않습니다.

## 데이터 배치 (VM에서)

환경변수 `LABEL_DATA_DIR`가 가리키는 폴더에 아래처럼 둡니다:

```
$LABEL_DATA_DIR/
  images/<환자ID>/<파일>.jpg      # eggim.resize_images 로 만든 리사이즈 세트(250명)
  labels/<expertId>.json          # 앱이 자동 생성 (전문가별)
```

- `images/` 는 리사이즈 도구 출력(`EGD_2026_label_1280`)을 그대로 복사하면 됩니다.
- 검사(exam) 단위는 **파일명의 환자ID + 검사일**로 자동 그룹핑됩니다(태깅 불필요).

## 실행 (클라우드 VM)

```bash
npm install
npm run build
LABEL_DATA_DIR=/data/eggim npm run start   # 기본 포트 3000
```

- HTTPS·접속 제한은 앞단(nginx/reverse proxy, 보안그룹)에서 두는 것을 권장합니다.
- 전문가는 브라우저로 `https://<vm>/label` 접속 → **전문가 식별자** 입력(예: `kim`, `lee`).
  라벨은 그 식별자별 JSON에 저장되어 서로 독립적입니다(전원이 동일 250명 라벨링 → 일치도 측정 가능).

## 라벨링 흐름

- **목록 화면** (`/label`): 250 검사, 완료/진행/미완 색상, 진행률, CSV 내보내기.
- **검사 화면** (`/label/exam/<examId>`):
  - 왼쪽: 큰 이미지 + 썸네일 그리드. 키보드 `1`~`6` 부위, `0` 화질부적정, `R` 대표사진, `←`/`→` 이동.
  - 오른쪽: **Kimura-Takemoto**(검사 1건), **EGGIM 부위별 등급 0/1/2**(→ 합계·고위험 자동), 저장/완료.
  - 변경 시 자동 저장.

라벨 3축의 단위:

| 축 | 단위 | 저장 위치 |
|---|---|---|
| Localization(+대표사진) | 이미지별 site/quality/representative | `images` |
| Kimura-Takemoto | 검사 1건 (normal, C-1~O-3) | `kimura` |
| EGGIM | 검사별 5부위 등급 → 합 0–10 | `eggim` |

## 내보내기 (학습·분석용)

- `GET /api/label/export?kind=images` — (전문가 × 이미지) 행: site/quality/representative
- `GET /api/label/export?kind=exams` — (전문가 × 검사) 행: kimura + 5부위 EGGIM + 합계

두 CSV 모두 전 전문가를 병합하므로, 판독자간 일치도(κ)와 합의 정답 산출에 바로 사용합니다
(`eggim/eggim/metrics.py`의 quadratic-weighted kappa 등과 연동).

## 검증 상태

- `next build` 타입체크/컴파일 통과(추가한 `/label`·API 라우트 기준).
- 개발 서버 기동 후 실동작 확인: exam 목록/상세, 이미지 서빙(200 image/jpeg), **경로 탈출 차단(404)**,
  라벨 PUT 저장, 진행률 반영, EGGIM 합계 자동계산(예: 2+1+1+2+1=7), CSV 2종.

> 참고: 이 저장소에는 스케줄 앱(Firebase)도 포함되어, Firebase 키 없이 `next build` 하면 스케줄 페이지
> 프리렌더에서 실패합니다. 라벨링 앱만 쓰려면 Firebase 환경변수를 채우거나 해당 페이지 프리렌더를
> 비활성화하면 됩니다(라벨링 라우트는 영향 없음).
