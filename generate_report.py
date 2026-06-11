#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a Word (.docx) report for the H. pylori eradication / immunosuppression study."""
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

DOC = Document()

# ---- base font (Korean-friendly) ----
def set_base_font(doc, name="Malgun Gothic", size=10.5):
    st = doc.styles["Normal"]
    st.font.name = name
    st.font.size = Pt(size)
    rpr = st.element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts'); rpr.append(rfonts)
    for a in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'):
        rfonts.set(qn(a), name)
set_base_font(DOC)

def _kfont(run, name="Malgun Gothic"):
    run.font.name = name
    r = run._element.get_or_add_rPr()
    rf = r.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); r.append(rf)
    for a in ('w:ascii','w:hAnsi','w:eastAsia','w:cs'):
        rf.set(qn(a), name)

def H(text, level=1):
    h = DOC.add_heading(level=level)
    run = h.add_run(text); _kfont(run)
    return h

def P(text="", bold=False, italic=False, size=None, color=None, align=None):
    p = DOC.add_paragraph()
    r = p.add_run(text); _kfont(r)
    r.bold = bold; r.italic = italic
    if size: r.font.size = Pt(size)
    if color: r.font.color.rgb = RGBColor(*color)
    if align: p.alignment = align
    return p

def BUL(text, level=0):
    p = DOC.add_paragraph(style="List Bullet")
    if level: p.paragraph_format.left_indent = Cm(0.6 + 0.6*level)
    r = p.add_run(text); _kfont(r)
    return p

def NUM(text):
    p = DOC.add_paragraph(style="List Number")
    r = p.add_run(text); _kfont(r)
    return p

def TABLE(headers, rows, widths=None):
    t = DOC.add_table(rows=1, cols=len(headers))
    t.style = "Light Grid Accent 1"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, htext in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = ""
        run = c.paragraphs[0].add_run(htext); _kfont(run); run.bold = True
        run.font.size = Pt(9)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            run = cells[i].paragraphs[0].add_run(str(val)); _kfont(run)
            run.font.size = Pt(9)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    DOC.add_paragraph()
    return t

# ===================== TITLE =====================
ttl = DOC.add_paragraph()
ttl.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = ttl.add_run("면역억제(고형장기이식) 환자에서\nHelicobacter pylori 제균과 위암·위장관 출혈"); _kfont(r)
r.bold = True; r.font.size = Pt(18)
sub = DOC.add_paragraph(); sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run("선행연구 종합 및 대규모·원내(CDW) 데이터 검증 연구계획 보고서"); _kfont(r)
r.font.size = Pt(13); r.italic = True
meta = DOC.add_paragraph(); meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = meta.add_run("작성일 2026-06-10 · 연구기획 보조 보고서(초안)"); _kfont(r); r.font.size = Pt(10); r.font.color.rgb = RGBColor(0x66,0x66,0x66)
DOC.add_paragraph()

# ===================== 0. 핵심 요약 =====================
H("핵심 요약 (Executive Summary)", 1)
BUL("확립된 근거 ①: 일반(면역정상) 인구에서 H. pylori 제균은 위암 발생을 약 45~55% 감소시킨다(RCT·메타분석 일관). 단, 근거 대부분이 동아시아 고위험 인구.")
BUL("확립된 근거 ②: 만성 면역억제(특히 고형장기이식)는 위암 위험을 약 1.7~2.3배 높이며, 위암은 H. pylori 매개 '감염관련 암'으로 분류된다.")
BUL("상충·미해결: IBD에서는 H. pylori 유병률이 오히려 낮고 위암도 증가하지 않는다. 면역억제가 위염→위축→암(Correa cascade)을 가속/약화하는지는 인체 데이터로 미입증.")
BUL("연구 공백(핵심): '면역억제제 사용자에서 제균 여부에 따른 위(선)암 발생 차이'를 직접 다룬 연구는 존재하지 않는다. 기존 근거는 모두 면역정상 인구 기반.")
BUL("권고 설계: ① 대규모 검증은 NHIS(국가검진코호트/맞춤형 NHID) 기반 후향적 코호트 + 대만 NHIRD/OMOP 복제. ② 원내 CDW 파일럿은 KT/LT 이식 수혜자에서 HP 연관 출혈(주력)과 위암 발생·조직형(기술·SIR)을 본다.")
BUL("대조군: 단일군 비권고. 코호트 내 제균 vs 비제균(active comparator)을 주로, 외부 표준화(SIR)와 비이식 매칭군을 보조로 결합한 2층 구조 권고.")

# ===================== 1. 배경/목적 =====================
H("1. 연구 배경 및 목적", 1)
P("면역억제제를 복용하는 환자(자가면역질환, 생물학제제 사용자, 고형장기이식 수혜자)는 위암 기저위험이 높을 수 있으나, 이 인구에서 H. pylori 제균이 위암·위장관 합병증을 줄이는지에 대한 직접 근거가 없다. 본 보고서는 (1) 관련 선행연구를 종합하고, (2) 대규모 실제임상데이터 및 원내 CDW로 이를 검증할 연구계획을 제시한다. 특히 신이식(KT)·간이식(LT) 수혜자에 초점을 둔 집중 설계를 포함한다.")

# ===================== 2. 선행연구 종합 =====================
H("2. 선행연구 종합", 1)

H("2.1 일반 인구에서 H. pylori 제균의 위암 예방 효과 (강한 근거)", 2)
TABLE(
    ["연구", "설계/인구", "핵심 결과"],
    [
        ["Li WQ 2019, BMJ (Shandong)", "factorial RCT, 고위험 3,365명, 22.3년", "위암 OR 0.48 (0.32–0.71); 사망 HR 0.62 (0.39–0.99)"],
        ["Ford 2020, Cochrane", "7 RCT, 무증상 8,323명", "발생 RR 0.54 (0.40–0.72); 사망 RR 0.61 (0.40–0.92)"],
        ["Lee 2016, Gastroenterology", "RCT+코호트, 48,064명", "전체 IRR 0.53 (0.44–0.64)"],
        ["Fukase 2008, Lancet", "내시경절제후 RCT, 544명", "이시성 위암 HR 0.339 (0.157–0.729)"],
        ["Choi 2018, NEJM (한국)", "절제후 이중맹검 RCT, 396명", "이시성 위암 HR 0.50 (0.26–0.94)"],
        ["Choi 2020, NEJM (한국)", "가족력자 RCT, 1,676명, 9.2년", "위암 HR 0.45 (0.21–0.94); 제균확인 0.27 (0.10–0.70)"],
        ["Liou 2021, Gut (대만 Matsu)", "지역사회 대량제균", "위암 발생 53%↓ (30–69%)"],
    ],
    widths=[4.5, 4.5, 7.0]
)
P("가이드라인(Maastricht VI 2022, Kyoto 2015, Taipei 2020, IARC 2024)은 H. pylori를 명확한 발암인자로 보고 감염자 전원 제균 및 고위험 지역 screen-and-treat를 권고한다. 위축·장상피화생 발생 이전 제균이 가장 효과적이다.", italic=True, size=9.5)

H("2.2 면역억제와 H. pylori·위염·발암 (근거 빈약·상충)", 2)
BUL("IBD에서 H. pylori 유병률 낮음(일관): Luther 2010 RR 0.64 (0.54–0.75); 2026 업데이트 OR 0.43 (0.35–0.53). 원인(5-ASA·과거 항생제·면역) 미해결.")
BUL("IBD에서 위암 미증가(때로 감소): 한국 궤양성대장염 코호트 위암 HR 0.60 (0.47–0.77).")
BUL("스테로이드는 H. pylori 정착 악화 안 시킴(동물). 면역억제가 활동성 위염 소견을 '가려' 진단 수율을 낮출 수 있음.")
BUL("MTX·azathioprine의 위 Correa cascade·위암 인체 데이터 없음 → 입증된 null이 아니라 공백.")
BUL("제균 성공률: 신이식 후보에서 48.5%로 낮은 보고(용법 교란). 면역억제군 vs 정상군 head-to-head 비교 없음.")

H("2.3 면역억제제 사용자(특히 이식)의 위암 위험 (중등도 근거)", 2)
TABLE(
    ["연구", "인구", "위암 위험"],
    [
        ["Engels 2011, JAMA", "미국 이식 175,732건", "위암 SIR 1.67 (1.42–1.96); '감염관련 암'으로 분류"],
        ["Wang 2018, Oncotarget", "신이식 메타분석 79,988명", "위암 SIR 1.93 (1.60–2.34)"],
        ["Jeong 2020, Sci Rep (한국)", "신이식 9,915명", "위암 SIR 2.3 (1.9–2.8); 전체암 3.9"],
    ],
    widths=[4.5, 4.5, 7.0]
)
BUL("기전: 면역감시 저하 → 감염관련 암(EBV, HHV-8, HPV, HBV/HCV, H. pylori→위암) 상승. 위암 상승폭은 바이러스성 암보다 작음.")
BUL("sirolimus는 피부암엔 보호적이나 위암 보호는 미입증. 이식 수혜자 H. pylori 상태↔위암 직접 연결도 미입증(유병률 오히려 낮을 수 있음).")

H("2.4 연구 공백 (Research Gap)", 2)
P("'면역억제제 복용/면역억제 상태에서 H. pylori 제균 여부에 따른 위(선)암 발생 차이'를 직접 다룬 연구는 확인되지 않는다.", bold=True)
BUL("기존 제균-위암 RCT/코호트는 면역억제 상태를 보고·층화하지 않음.")
BUL("가장 가까운 연구도: (a) 이식 후보 제균률/합병증만, (b) 선암 아닌 MALT 림프종, (c) IBD 제균 결정 논의(암 발생 분석 없음).")
P("→ 본 연구는 신규성이 있으며, 면역억제 시작 전 screen-and-treat 임상결정에 직접 기여할 수 있다.", italic=True, size=9.5)

# ===================== 3. 대규모 검증 계획 =====================
H("3. 대규모 데이터(NHIS) 검증 연구계획", 1)
H("3.1 연구 질문 (PICO) 및 가설", 2)
BUL("P: 면역억제제를 신규 개시한 성인 / I: H. pylori 제균(성공) / C: 비제균(또는 미성공) / O: 위선암(C16) 발생")
BUL("H1: 제균군은 비제균군보다 위암 발생이 낮다(HR<1). 탐색: 면역억제 종류·강도·기간에 따른 효과수정.")

H("3.2 설계 및 데이터 소스", 2)
P("후향적 코호트(new-user, active-comparator, target trial emulation). 1차 NHIS(검진코호트 HEALS 또는 맞춤형 NHID), 복제는 대만 NHIRD/OMOP.")
TABLE(
    ["소스", "강점", "한계/적합성"],
    [
        ["NHIS 검진코호트(HEALS)", "검진 공변량(BMI·흡연·음주), 암 종점", "40세 이상·표본 → 1차 권고"],
        ["NHIS 맞춤형 NHID(전국민)", "검정력 최대", "온사이트 분석·KCCR 연계 제한"],
        ["대만 NHIRD", "암등록(병기) 연계", "복제 코호트로 적합"],
        ["OMOP/FEEDER-NET", "다기관·국제 표준 복제", "맞춤연계 약함"],
    ],
    widths=[4.0, 5.5, 6.0]
)

H("3.3 조작적 정의 (검증된 알고리즘)", 2)
BUL("면역억제 노출: ATC L04 등(스테로이드 H02AB, MTX L04AX03, azathioprine L04AX01, CNI L04AD, TNF억제제 L04AB). 신규사용자 365일 washout, grace 60일, 스테로이드 누적용량(프레드니솔론 환산) 범주화. 시간의존.")
BUL("제균(Park 2023): PPI/P-CAB + 항생제 2종 동시 처방. 식별 민감도 99.7%. 성공=치료 후 21일~6개월 확인검사.")
BUL("위암(Yang 2022): ICD-10 C16 + 중증등록 V193 복합정의, 민감도 96.0%/PPV 94.1%. look-back 2년으로 incident 한정.")

H("3.4 통계 및 표본수", 2)
BUL("주분석: 시간의존 Cox + landmark(immortal time 차단). 경쟁위험 Fine-Gray. 성향점수(IPTW/매칭). lag 1–3년·음성대조·E-value 민감도.")
TABLE(
    ["시나리오(비제균 10년 누적발생)", "HR 0.6 검출 N (1:2)", "HR 0.7 검출 N (1:2)"],
    [
        ["보수 1.0%", "≈ 15,900", "≈ 32,700"],
        ["기본 2.0%", "≈ 7,900", "≈ 16,400"],
        ["고위험(이식) 3.0%", "≈ 5,300", "≈ 10,900"],
    ],
    widths=[6.0, 4.7, 4.7]
)
P("→ NHIS 전국민/대규모 코호트면 HR 0.6은 전 시나리오, HR 0.7도 기본·고위험에서 검정력 확보.", italic=True, size=9.5)

# ===================== 4. KT/LT CDW 집중 설계 =====================
H("4. KT/LT 이식 수혜자 · 원내 CDW 집중 설계", 1)
P("단일기관(다기관 확장 가능) 임상데이터웨어하우스(CDW)는 HP 검사·내시경/병리·검사실수치(Hb·수혈)·면역억제 레지멘을 직접 보유해 본 주제에 적합하다. 대상은 신이식(KT)·간이식(LT) 수혜자.")

H("4.1 두 가지 연구 질문", 2)
NUM("Q1. 이식 전후 제균 여부에 따라 H. pylori 연관 (상부위장관) 출혈에 차이가 있는가? — 사건 흔하고 잠복 짧아 단일기관 CDW 주력 종점.")
NUM("Q2. 이식 전후 제균 여부에 따라 위암 발생에 차이가 있는가? 있다면 어떤 조직형(Lauren형, EBV연관 위암 EBVaGC 비율, MSI/HER2, PTLD 감별)이 주로 발생하는가? — 드물고 잠복 길어 발생률·SIR·조직형 기술이 1차 산출물.")

H("4.2 노출 정의", 2)
BUL("제균: PPI/P-CAB+항생제 2종(Park 2023). 성공=치료 후 4주~6개월 확인검사 음성.")
BUL("시점 층화(핵심): 이식 전 제균 vs 이식 후 제균 vs 비제균. 이식일을 time-zero로, 노출은 시간의존 모델링(immortal time 차단).")

H("4.3 대조군 설계 (핵심) — 옵션·권고", 2)
TABLE(
    ["설계", "비교 구조", "답하는 질문", "한계"],
    [
        ["A. 단일군+외부기준(SIR)", "이식 코호트 vs 일반인구 기대 GC", "면억이 GC를 높이나?", "제균 효과 입증 불가, 출혈 부적합"],
        ["B. 코호트 내 active comparator", "HP+ 제균 vs HP+ 비제균(±HP−)", "제균이 출혈·GC를 줄이나?", "confounding by indication, 프로토콜화 시 비제균군 희소"],
        ["C. 비이식 HP+ 매칭 대조", "이식 HP+ vs 비이식 HP+ (동일 CDW)", "이식/면억이 위험을 바꾸나?", "매칭 교란(적응증 차이)"],
    ],
    widths=[4.0, 4.3, 3.6, 4.1]
)
P("권고: B를 주(主)로, A·C를 보조로 결합한 2층 구조.", bold=True)
BUL("주 분석(Q1·Q2): B — HP 양성 이식 수혜자 내 제균(성공) vs 비제균. '제균 여부 차이' 질문의 직접·필수 비교.")
BUL("면역억제 증폭 가설(Q2 배경): A(SIR, 일반인구 대비) + C(비이식 HP+ 매칭). 이상적으로는 (이식 vs 비이식)×(제균 vs 비제균) 2×2 요인 틀로 면억·제균·상호작용을 동시 추정.")
BUL("순수 single-arm 비권고: 발생률·조직형 기술과 SIR까지만 가능, '제균이 결과를 바꾼다'는 비제균 비교군 필수. 단 GC 조직형 분포는 본질적으로 기술적이라 단일군 기술 + 일반 위암 분포 비교가 타당.")

H("4.4 프로토콜화 기관에서의 대안 비교군 (착수 전 필수 점검)", 2)
P("이식 전 HP screen-and-treat가 표준화되어 비제균군이 거의 없으면 B 불가. 대안:")
BUL("① 제균 성공 vs 실패  ② 제균 시점(이식 전/후/미시행)  ③ 프로토콜 도입 전후(era) 비교  ④ HP 음성 vs HP 양성-제균")
P("→ CDW로 기관의 이식 전 HP 관리 프로토콜 유무·도입시기·실제 시행률을 먼저 확인할 것.", italic=True, size=9.5)

H("4.5 통계·검정력·실현가능성", 2)
BUL("Q1 출혈: 시간의존 Cox + 경쟁위험(사망·이식실패) Fine-Gray + 재출혈 반복사건(Andersen-Gill). 사건 충분 → 단일기관 비교 가능.")
BUL("Q2 위암: 시간의존 Cox + Fine-Gray; 사건 적으면 Firth 벌점/정확법, 발생률+SIR 중심. 조직형은 빈도·비율(EBVaGC %, Lauren).")
BUL("실현가능성: 대형센터 20년 KT 2,000–3,000 + LT 1,600–2,400, HP+ ~40–50%. 출혈은 비교분석 가능, 위암은 기술/SIR 1차 → 비교 HR은 다기관/NHIS 확장으로 확정.")
BUL("단계적 접근: (1) CDW 파일럿 = Q1 주분석 + Q2 기술/SIR → (2) 다기관 CDW(OMOP)/NHIS로 Q2 비교분석 확정.")

# ===================== 5. 한계/윤리 =====================
H("5. 한계 및 윤리", 1)
BUL("한계: 단일기관 외부타당도·추적 누락, confounding by indication, detection/surveillance bias, 위암 희소로 검정력, EBVaGC 판정 가용성, 프로토콜화 시 비제균군 부족.")
BUL("윤리: 후향 2차자료/CDW → IRB 심의(동의면제 가능). STROBE/RECORD-PE 준수, 전체 코드목록·참여자 흐름도·Table1(SMD) 공개.")

# ===================== 6. 결론/다음 단계 =====================
H("6. 결론 및 다음 단계", 1)
BUL("면역억제(이식) 환자에서 제균 여부별 위암·출혈 차이는 미연구 영역으로 연구가치가 높다.")
BUL("CDW 파일럿(출혈 종점)으로 신속히 근거를 생성하고, NHIS/다기관으로 위암 종점을 확정하는 단계적 전략을 권고한다.")
BUL("착수 전 확정 필요: 기관 이식 전 HP 프로토콜·시행률, 대조군 전략(B vs 대안), 검정력 시뮬레이션, EBVaGC 포함 조직형 CRF.")

# ===================== 참고문헌 =====================
H("주요 참고문헌", 1)
refs = [
    "Li WQ, et al. BMJ 2019 (Shandong/Linqu). PMC6737461",
    "Ford AC, et al. Cochrane Database Syst Rev 2020. PMC7389270",
    "Lee YC, et al. Gastroenterology 2016. PMID 26836587",
    "Fukase K, et al. Lancet 2008. PMID 18675689",
    "Choi IJ, et al. N Engl J Med 2018. PMID 29562147; 2020. PMID 31995688",
    "Liou JM, et al. Gut 2021 (대만 Matsu). PMC7815911",
    "Engels EA, et al. JAMA 2011. PMID 22045767",
    "Wang Y, et al. Oncotarget 2018 (신이식 메타분석)",
    "Jeong S, et al. Sci Rep 2020 (한국 신이식). PMC7722878",
    "Luther J, et al. Inflamm Bowel Dis 2010. PMC4865406",
    "Park CH, et al. J Korean Med Sci 2023;38:e278 (제균 정의). PMC10477078",
    "Yang MS, et al. Cancer Res Treat 2022;54:352 (위암 정의검증). PMC9016317",
    "Maioli ME, et al. J Bras Nefrol 2022 (이식후보 제균). PMC9269173",
]
for rr in refs:
    p = DOC.add_paragraph(style="List Number")
    run = p.add_run(rr); _kfont(run); run.font.size = Pt(9)

P()
P("면책: 본 보고서는 연구 기획 보조 자료입니다. 인용 수치는 출처 초록/원문 기준으로 정리했으며, 일부 NEJM 본문은 접근 제한으로 PubMed 초록의 동일 수치를 교차확인했습니다. 프로토콜 확정 전 원문 재확인 및 통계·이식·소화기 전문가, 기관 CDW/NHIS 자료담당 검토를 권고합니다.",
  italic=True, size=8.5, color=(0x66,0x66,0x66))

OUT = "/home/user/dahyunschedule/HP_immunosuppression_gastric_cancer_report.docx"
DOC.save(OUT)
print("Saved:", OUT)
