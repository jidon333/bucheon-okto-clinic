# 부천 옥토한의원 웹사이트

한의원 소개와 8체질 섭생표를 제공하는 반응형 웹사이트입니다. **소스 수정과 실제 사이트 배포를 분리해 운영합니다.**

읽는 순서: [요약](#요약) → [로컬에서 실행하고 수정하기](#로컬에서-실행하고-수정하기) → [협업과 배포](#협업과-배포) → [자료 구조와 검증](#자료-구조와-검증).

## 요약

- 한의원 소개·진료·첫 방문·오시는 길과 별도의 8체질 섭생표 페이지가 있습니다. 섭생표는 체질 선택, 음식 검색, 분류 필터와 페이지 이동을 지원합니다.
- 소스를 내려받은 사람은 자신의 컴퓨터에서 수정·검토할 수 있습니다. 공개 저장소라는 이유만으로 원본 저장소에 직접 수정할 권한이 생기지는 않습니다.
- 한의사는 수정안을 만들고, 저장소 소유자는 반영할 내용을 확인한 뒤 자신의 Cloudflare 계정에서 배포하는 방식으로 운영할 수 있습니다.
- 이 저장소에는 Cloudflare 자동 배포 설정이나 배포 인증정보가 없습니다. 소스를 올리는 것만으로 실제 사이트가 변경되지 않습니다. 추후 Cloudflare에서 자동 배포를 연결하면 동작이 달라집니다.
- 현재는 내용 검토용 시안이며 검색 노출을 막는 설정이 남아 있습니다. 담당 한의사의 섭생 내용 검토와 운영 정보 확정 후 공개용으로 전환합니다.

## 로컬에서 실행하고 수정하기

[Node.js](https://nodejs.org/) 22 이상이 필요합니다. 현재 Node.js 24에서 검사했으며, 추가 패키지 설치나 빌드 과정 없이 실행됩니다.

Git으로 내려받는 경우:

```sh
git clone https://github.com/jidon333/bucheon-okto-clinic.git
cd bucheon-okto-clinic
npm run dev
```

Git을 사용하지 않는 경우 GitHub의 **Code → Download ZIP**으로 내려받아 압축을 풀고, 해당 폴더에서 `npm run dev`를 실행합니다. Windows PowerShell에서 `npm` 실행 정책 오류가 나면 `npm.cmd run dev`를 사용합니다.

브라우저에서 다음 주소를 엽니다.

- 홈페이지: <http://127.0.0.1:4318/>
- 섭생표: <http://127.0.0.1:4318/diet.html>

파일을 수정하고 저장한 뒤 브라우저를 새로고침하면 반영됩니다. 서버 종료는 실행한 터미널에서 `Ctrl+C`입니다. 이미 이 프로젝트의 서버가 실행 중이면 같은 주소를 사용합니다. `4318` 포트가 다른 프로그램에 사용 중이면 `PORT` 환경변수로 다른 포트를 지정합니다.

한글 문구·음식명을 추가한 경우 필요한 글자를 포함하도록 로컬 웹폰트를 갱신합니다. 이때 공개 Google Fonts 서버에 연결됩니다.

```sh
npm run fonts
npm run check
```

로컬에서 화면, 메뉴, 체질 선택, 검색, 자료 파일을 확인할 수 있습니다. 실제 도메인 연결과 보안 접속은 배포 후 확인합니다.

## 협업과 배포

### 한의사가 수정안을 보내는 방식

1. 이 저장소를 **Fork(자신의 계정에 저장소 복사)** 합니다.
2. 복사한 저장소를 자신의 컴퓨터로 내려받아 수정합니다.
3. `npm run check`와 브라우저 확인을 마친 뒤 자신의 저장소에 올립니다.
4. 원본 저장소에 Pull Request(변경 반영 요청)를 보냅니다.
5. 소유자가 변경 내용을 확인해 반영하고, 원하는 시점에 배포합니다.

이 방식은 Cloudflare 계정이나 인증정보를 공유할 필요가 없습니다. 같은 저장소에서 직접 작업하려면 소유자가 한의사의 GitHub 계정을 협업자로 초대할 수 있습니다. 협업자 초대와 Cloudflare 배포 권한 부여는 별개입니다. [GitHub 권한 안내](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)

### 소유자만 수동 배포하는 방식

현재 프로젝트에는 GitHub와 Cloudflare 연결 설정이 없습니다. 처음 연결할 때 아래 중 하나를 선택합니다.

- **파일 직접 업로드:** 소유자 계정의 Cloudflare Pages에서 Direct Upload 프로젝트를 만들고, 검토한 버전의 `dist` 폴더를 업로드합니다. 업데이트도 같은 프로젝트에 직접 올립니다.
- **GitHub 연동 후 수동 배포:** Cloudflare Pages에서 운영 브랜치의 자동 배포를 끄고 미리보기 브랜치를 `None`으로 설정합니다. 소유자가 검토한 버전을 Wrangler로 직접 배포합니다.

직접 업로드로 만든 프로젝트는 나중에 같은 프로젝트를 GitHub 연동 방식으로 전환할 수 없습니다. 자동 배포가 필요해지면 새 프로젝트를 만들어야 합니다. 처음부터 GitHub 연동으로 만든 프로젝트는 자동 배포를 꺼두고 Wrangler로 수동 배포할 수 있습니다. [직접 업로드](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [자동 배포 끄기](https://developers.cloudflare.com/pages/configuration/git-integration/#disable-automatic-deployments)

**배포 대상은 `dist` 폴더입니다.** `server.mjs`는 자신의 컴퓨터에서 미리보기를 띄우는 용도입니다. 저장소 전체, 테스트 자료, 작업 기록은 웹 호스팅에 올리지 않습니다.

정식 공개 전에는 한의사 검토 내용과 운영 정보를 확정하고 미리보기 문구·검색 제외 설정을 함께 조정합니다. 현재 검사는 두 페이지의 `noindex, nofollow`를 시안의 조건으로 확인하므로, 공개 전환 때는 `scripts/check.mjs`의 해당 조건도 의도에 맞게 수정합니다.

## 자료 구조와 검증

| 수정할 내용 | 파일 |
| --- | --- |
| 한의원 소개·진료시간·주소·전화 | `dist/index.html` |
| 공통 색상·서체·반응형 구성 | `dist/styles.css` |
| 메뉴·펼침 안내·주소 복사 | `dist/app.js` |
| 섭생표 페이지 구성·문구 | `dist/diet.html` |
| 섭생표 화면 스타일 | `dist/diet.css` |
| 체질 선택·검색·분류·페이지 이동 | `dist/diet.js` |
| 체질별 음식·등급·참고사항 | `dist/data/diet-guides.json` |
| 자료 형식 검사·등급 표시·검색 규칙 | `dist/diet-model.mjs` |

### 섭생 내용 바꾸기

`dist/data/diet-guides.json`에서 해당 체질의 `rows`를 수정합니다.

| 필드 | 뜻 |
| --- | --- |
| `category` | 음식·항목의 분류 |
| `item` | 음식·항목 이름 |
| `guidance` | 등급 또는 안내 문구 |
| `note` | 추가 참고사항. 없으면 빈 문자열 |

`gradeScale`이 `five-level`이면 등급은 `OO`, `O`, `Δ`, `X`, `XX`, 빈 문자열 중 하나를 사용합니다. 빈 문자열은 **확인 필요**로 표시되며 다른 등급으로 추정하지 않습니다. 등급의 화면 문구와 색상 분류는 `dist/diet-model.mjs`의 `REFERENCE_GRADES`에 정의되어 있습니다.

담당 한의사가 내용을 실제로 확인한 체질은 다음과 같이 검토 정보를 갱신합니다.

- `status`: `reviewed`
- `source`: `옥토한의원` 등 실제 자료 작성 주체
- `reviewedAt`: 실제 확인일을 `YYYY-MM-DD` 형식으로 입력
- `sourceUrl`: 이전 외부 링크는 제거하거나 실제 자료에 맞게 변경

이 정보는 이력과 검사를 위한 데이터이며, 현재 페이지는 출처명·링크를 화면에 표시하지 않습니다. 모든 체질의 검토가 끝나면 상단의 검토 중 시안 표시도 사라집니다. 서술식 안내로 바꾸려면 `status`를 `reviewed`로 설정하고 `gradeScale`을 제거한 뒤 `guidance`에 안내 문구를 입력합니다.

원본 이미지나 PDF로 바꾸려면 `dist/assets/diet/` 폴더에 자료를 넣고 해당 체질의 `image` 또는 `pdf`에 `assets/diet/파일명`을 지정합니다. 원본만 표시하려면 `rows`는 빈 배열로 둡니다. 검토된 자료에는 행·이미지·PDF 중 적어도 하나가 필요합니다. 8개 체질의 ID와 이름은 유지합니다.

### 검사 범위

`npm run check`는 자바스크립트 문법, 두 페이지의 파일·구간 링크·한글 인코딩, 섭생 자료 형식과 모델 테스트를 검사합니다. 공개 원문에서 가져온 초기 표는 `tests/fixtures/ireh-original.json`과 대조합니다. 초기 상태 그대로를 뜻하는 `reference` 자료를 수정했다면 실제 검토 주체와 날짜를 기록해 `reviewed`로 전환해야 합니다.

이 검사는 코드·자료 형식을 확인합니다. 의학적 적합성은 담당 한의사가 판단합니다. 화면 수정 후에는 PC와 휴대전화 크기에서 메뉴·표·검색 결과를 브라우저로 함께 확인합니다.

### 이미지·폰트와 공개 범위

공식 녹색 8자 심벌, 네이버 지도 위치 안내, 차 정물 이미지와 숲 사진을 사용합니다. 위치 안내는 [옥토한의원 네이버 지도](https://map.naver.com/p/entry/place/1386605586) 화면을 저장한 `dist/assets/octo-naver-map.jpg` 위에 원을 표시합니다. 원의 위치와 크기는 `dist/styles.css`의 `.clinic-map-circle`에서 조정하며, 지도 이미지를 교체하면 위치도 함께 확인해야 합니다. 폰트는 Noto Sans KR·Noto Serif KR이며 라이선스는 `dist/assets/fonts/OFL-*.txt`에 포함되어 있습니다. 숲 사진은 [Joyce G / Unsplash](https://unsplash.com/photos/the-sun-shines-through-the-trees-in-the-forest-d4fo26jGvlw) 자료입니다. 첫 화면의 차 이미지는 실제 한의원 공간이 아닌 연출 이미지입니다.

공개 저장소라는 사실이 제3자 자료나 브랜드의 권리를 변경하지는 않습니다. 로고·사진·외부 자료와 코드의 권리는 각각 구분합니다. 한의원 웹사이트 수정에 필요한 파일만 포함하며, 개인 계정 정보·디스코드 전송 도구·내부 작업 기록은 저장소에 포함하지 않습니다.
