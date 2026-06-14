# TodoSom 구현 문서 인덱스

이 문서 모음은 `todosom_whitepaper_v0_1.docx`를 원천으로, TodoSom을 무료 베타부터 첫 BM 검증까지 가져가기 위한 작업 기준을 정리한 것이다. 목적은 기획, 디자인, 개발, AI 코딩 도구가 같은 제품을 상상하도록 만드는 것이다.

백서는 TodoSom이 사업체와 팀으로 커진 뒤에도 방향을 잃지 않기 위한 큰그림 문서다. 구현 문서는 그 큰그림을 1인 예비 창업자가 바이브코딩으로 실행 가능한 단계로 나누기 위한 기준이다.

## 원천 자료

| 항목 | 값 |
| --- | --- |
| 원천 문서 | `todosom_whitepaper_v0_1.docx` |
| 원천 버전 | TodoSom Product Whitepaper, Founder Draft v0.1 |
| 원천 작성일 | 2026-06-12 |
| 구현 문서 범위 | 무료 베타부터 첫 BM 검증까지의 1차 MVP |
| 기본 스택 | React Native + Expo, TypeScript, Expo Router, expo-sqlite, Zustand |

## 구현 목표

1차 MVP의 목표는 무료로 충분히 사랑받을 수 있는 핵심 루프를 출시하고, 사용자가 돈을 내도 납득할 첫 감성 확장 상품 1개를 검증하는 것이다.

첫 단계인 로컬 프로토타입의 목표는 서버, 로그인, 결제 없이도 핵심 루프가 기기 안에서 한 바퀴 도는 것이다.

```text
할 일 생성
-> 핵심 씨앗 선택
-> 할 일 완료
-> 결 점수 획득
-> 펫 반응
-> 성장기 진화
-> 기록의 방 보관
```

첫 버전은 기능 수보다 감정 루프의 명확성을 우선한다. 사용자가 "내가 한 일이 펫에게 남았다"는 느낌을 받으면 성공이다.

## 문서 목록

| 파일 | 용도 |
| --- | --- |
| [01-product-brief.md](01-product-brief.md) | 제품 정의, 핵심 루프, 원칙, 타깃 |
| [02-mvp-scope.md](02-mvp-scope.md) | MVP 필수/후순위/제외 범위와 단계별 완료 기준 |
| [03-ux-ia-screen-spec.md](03-ux-ia-screen-spec.md) | 화면 구조, 온보딩, 오늘, 펫방, 기록, 상점 placeholder 명세 |
| [04-domain-model.md](04-domain-model.md) | TypeScript 타입, 엔티티, 상태 흐름 |
| [05-gyeol-scoring-evolution.md](05-gyeol-scoring-evolution.md) | 7개 결, 보상, 점수 계산, 진화 판정 |
| [06-local-data-storage.md](06-local-data-storage.md) | expo-sqlite 로컬 DB 스키마와 저장소 규칙 |
| [07-art-dialogue-content.md](07-art-dialogue-content.md) | 픽셀 아트, 펫방 레이어, 대사 콘텐츠 기준 |
| [08-analytics-qa.md](08-analytics-qa.md) | 핵심 이벤트, MVP 지표, QA와 수용 기준 |
| [09-ai-build-prompts.md](09-ai-build-prompts.md) | Cursor/AI 구현 프롬프트와 작업 분해 |
| [10-production-readiness-plan.md](10-production-readiness-plan.md) | 실제 배포 가능급 앱으로 올리기 위한 수정 계획 |
| [11-beta-to-first-bm-mvp.md](11-beta-to-first-bm-mvp.md) | 무료 베타부터 첫 BM 검증까지의 1차 MVP 정의 |
| [12-final-direction-summary.md](12-final-direction-summary.md) | 지금까지 합의한 방향의 최종 총정리 |

## 권장 구현 순서

1. `01-product-brief.md`와 `02-mvp-scope.md`로 제품의 경계와 MVP 범위를 고정한다.
2. `04-domain-model.md`와 `06-local-data-storage.md`로 타입, DB, repository 계층을 먼저 만든다.
3. `05-gyeol-scoring-evolution.md`의 순수 도메인 로직을 UI 없이 테스트 가능하게 구현한다.
4. `03-ux-ia-screen-spec.md`에 따라 Expo Router 화면과 기본 내비게이션을 만든다.
5. `07-art-dialogue-content.md` 기준으로 placeholder 에셋, 말풍선, 펫 상태 반응을 연결한다.
6. `08-analytics-qa.md`의 QA 시나리오로 첫 투두부터 첫 진화까지 점검한다.
7. `09-ai-build-prompts.md`의 프롬프트를 사용해 작업 단위를 쪼개고 반복 구현한다.
8. `10-production-readiness-plan.md`로 출시 가능성, 정책, 품질, 운영 준비를 단계별로 보강한다.
9. `11-beta-to-first-bm-mvp.md`로 무료 베타부터 첫 BM 검증까지의 1차 MVP 경계를 관리한다.
10. `12-final-direction-summary.md`를 기준으로 전체 방향이 흔들리지 않는지 점검한다.

## 1차 MVP 완료 정의

1차 MVP는 다음이 모두 가능해야 완료로 본다.

- 사용자가 온보딩에서 첫 할 일을 만들고 완료한다.
- 모든 사용자는 같은 기본 유년기 펫 `솜몽`으로 시작한다.
- 사용자가 카테고리를 만들고 7개 결 중 하나에 연결한다.
- 사용자가 오늘의 핵심 씨앗을 1개에서 3개까지 선택한다.
- 완료된 할 일은 간식결, 작은 진화결, 깊은 진화결, 회복결 중 하나로 기록된다.
- 결 점수 이벤트가 누적값만이 아니라 이벤트 로그로 저장된다.
- 첫 7일 또는 진화결 기준 충족 시 성장기 진화가 발생한다.
- 이전 여정은 삭제되지 않고 기록의 방에 남는다.
- 무료 베타에서 핵심 퍼널과 리텐션 지표를 확인할 수 있다.
- 첫 BM 상품 1개가 진화 성능이 아닌 감성 확장으로 제공된다.
- 첫 BM의 구매, 복원, 권한 반영이 정상 동작한다.

## 고정 원칙

- 실패한 사용자를 벌하지 않는다. 펫 사망, 강한 연속 기록 패널티, 죄책감 문구는 넣지 않는다.
- 진화 성능을 돈으로 팔지 않는다. 유료 상품은 외형, 방, 서사, 연출 확장에 한정한다.
- 무료 사용자는 핵심 진화, 기본 도감, 새 여정의 재미를 충분히 경험해야 한다.
- 투두 입력은 빠르고 심플해야 한다. 펫 화면은 감정적으로 풍부해야 한다.
- 확장은 UI보다 데이터 구조에서 먼저 열어둔다.

## 구현 전 확인 사항

이 문서의 외부 기술 선택은 백서 작성일 기준이다. 실제 앱 구현 직전에는 Expo, Expo Router, expo-sqlite, Supabase, RevenueCat, Apple App Review, Google Play 결제 정책의 최신 공식 문서를 다시 확인한다.
