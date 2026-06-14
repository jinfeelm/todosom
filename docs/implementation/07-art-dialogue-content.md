# 아트, 대사, 콘텐츠 기준

## 아트 철학

TodoSom의 승부처는 펫 퀄리티다. 투두 앱의 실용성은 기본이고, 사용자가 매일 자발적으로 열려면 펫이 충분히 사랑스러워야 한다. 도트 감성은 유지하되 저해상도처럼 보이면 안 된다.

목표는 "레트로 감성의 현대적 고급화"다.

## 펫 아트 스펙

| 항목 | 권장 스펙 | 비고 |
| --- | --- | --- |
| 원본 캔버스 | 256x256px 이상 | 기본 펫도 작게 만들지 않는다 |
| 주요 진화체 | 384x384px 고려 | 상점, 도감, 진화 장면에서 고급감 |
| 화면 표시 | 320~480px | 픽셀 선명도 유지 |
| UI 프레임 | 60fps | 스크롤과 전환은 부드럽게 |
| 펫 애니메이션 | 12~24fps | 도트 맛을 살리는 프레임감 |
| 기본 상태 | idle, happy, eat, sleep, talk, evolve | MVP 기준 |
| 프레임 수 | 상태당 6~16프레임 | 진화는 더 풍부하게 |
| 파일 방식 | PNG sprite sheet + JSON metadata | 구현 단순성 |
| 이펙트 | 결 흡수, 반짝임, 진화 빛, 말풍선 | 고급감의 핵심 |

## 금지사항

- 작고 흐릿한 저해상도 이미지를 크게 늘리지 않는다.
- 캐릭터 외곽선이 너무 검고 딱딱해 보이지 않게 한다.
- UI 전체를 과도하게 픽셀화하지 않는다. 펫은 도트, UI는 현대적으로 간다.
- 여성향을 단순히 핑크와 리본으로만 표현하지 않는다.
- 무료 기본 펫의 퀄리티를 낮추지 않는다. 무료 기본 펫이 브랜드 대표다.

## 에셋 폴더 구조

```text
src/assets/
  pets/
    som_mong/
      manifest.json
      idle.png
      happy.png
      eat.png
      sleep.png
      talk.png
      evolve.png
    growth/
      lens_som/
      maker_som/
      note_som/
      spark_som/
      breath_som/
      ring_som/
      cube_som/
  rooms/
    default_room/
      background_wall.png
      floor.png
      manifest.json
  effects/
    gyeol_absorb.png
    sparkle.png
    evolve_light.png
```

## sprite manifest 예시

```json
{
  "assetKey": "som_mong",
  "displayName": "솜몽",
  "baseSize": { "width": 256, "height": 256 },
  "states": {
    "idle": {
      "image": "idle.png",
      "frameWidth": 256,
      "frameHeight": 256,
      "frameCount": 8,
      "fps": 12,
      "loop": true
    },
    "talk": {
      "image": "talk.png",
      "frameWidth": 256,
      "frameHeight": 256,
      "frameCount": 10,
      "fps": 12,
      "loop": true
    }
  }
}
```

## 펫방 레이어 구조

| 레이어 | 설명 | MVP |
| --- | --- | --- |
| `background_wall` | 벽지, 날씨, 창문 배경 | 기본 포함 |
| `floor` | 바닥 | 기본 포함 |
| `window` | 시간대, 날씨 효과 | 후순위 |
| `furniture_back` | 책장, 침대 등 펫 뒤 가구 | 데이터 구조만 |
| `pet` | 현재 펫 스프라이트 | 필수 |
| `furniture_front` | 러그, 작은 소품 등 앞 레이어 | 데이터 구조만 |
| `effects` | 결 흡수, 반짝임, 진화 이펙트 | 필수 |
| `speech_bubble` | 말 걸기 대사 | 필수 |

## 대사 시스템

초기에는 자유형 AI 채팅을 넣지 않는다. 말 걸기 버튼과 상태 기반 짧은 대사만 사용한다.

### 대사 조건

| 조건 | 대사 방향 | 예시 |
| --- | --- | --- |
| 오늘 첫 접속 | 부드럽게 시작 유도 | 오늘은 어떤 씨앗을 심을까? 하나만 골라도 충분해. |
| 첫 완료 | 첫 성취 인정 | 씨앗 하나가 결이 되었어. 조금 따뜻해졌어. |
| 핵심 씨앗 완료 | 강하게 칭찬 | 방금 건 꽤 빛났어. 내 안쪽 결이 움직였어. |
| 창작결 증가 | 성향 인식 | 요즘 너한테서 만드는 냄새가 나. 내 손끝도 간질간질해. |
| 돌봄결 증가 | 회복 인정 | 숨이 조금 고르게 변했어. 오늘의 너도 돌본 거야. |
| 정돈결 증가 | 정리 감각 | 흐트러진 것들이 자리를 찾고 있어. 내 털도 반듯해졌어. |
| 간식결만 많음 | 부드러운 안내 | 기분은 좋은데, 몸의 결을 바꾸려면 묵직한 씨앗도 필요해. |
| 오랜만 복귀 | 기다림과 환영 | 조금 오래 잠들어 있었어. 그래도 네 발소리는 기억나. |
| 진화 직전 | 기대감 조성 | 내 몸 안쪽에서 결이 갈라지고 있어. 곧 모양이 정해질 것 같아. |
| 새 여정 | 보관과 지속 | 나는 사라지는 게 아니야. 네 기록의 방에 남을게. |

## dialogue 타입

```ts
export interface DialogueLine {
  id: string;
  condition:
    | 'first_open_today'
    | 'first_completion'
    | 'core_seed_completed'
    | 'dominant_gyeol'
    | 'snack_heavy'
    | 'return_after_absence'
    | 'near_evolution'
    | 'new_journey';
  gyeolType?: GyeolType;
  minAffection?: number;
  text: string;
  animationState: 'idle' | 'happy' | 'talk' | 'eat' | 'sleep' | 'evolve';
}
```

## 친밀도

친밀도는 초기에는 작게 둔다. 진화 성능에 큰 영향을 주지 않고 대사, 모션, 작은 표정 변화를 여는 정도가 적절하다.

| 행동 | affection 변화 |
| --- | --- |
| 말 걸기 | +1, 하루 상한 적용 |
| 핵심 씨앗 완료 | +2 |
| 첫 완료 | +1 |
| 오랜만 복귀 | +1, 벌점 없음 |

## 방 꾸미기 BM 준비

MVP에서 방 꾸미기 풀기능은 만들지 않는다. 하지만 데이터와 레이어 구조는 열어둔다.

| 상품군 | 예시 | 도입 시점 |
| --- | --- | --- |
| 방 테마 | 새벽 공부방, 비 오는 방, 코지 침실 | 초기 BM 가능 |
| 가구 | 책상, 조명, 러그, 침대, 화분 | MVP 이후 |
| 계절 세트 | 벚꽃방, 장마방, 크리스마스방 | 시즌 운영 이후 |
| 결 테마 | 몰입결 도서관, 돌봄결 온천방 | 진화 시스템 안정 후 |
| 펫 소품 | 리본, 모자, 가방, 오라 | 초기 BM 가능 |

## 아트 QA

- 펫이 오늘 화면보다 펫방에서 더 크게, 더 선명하게 보여야 한다.
- 스프라이트 확대 시 흐릿하거나 깨진 느낌이 없어야 한다.
- 배경과 펫의 명도 대비가 충분해야 한다.
- 말풍선이 펫의 중요한 실루엣을 가리지 않아야 한다.
- 무료 기본 펫만으로도 사용자가 애착을 느낄 수 있어야 한다.
