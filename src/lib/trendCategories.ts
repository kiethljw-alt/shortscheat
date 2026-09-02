// 네이버 데이터랩 검색어트렌드로 관심도 추이를 확인할 숏폼 콘텐츠 카테고리 목록.
// 데이터랩 API는 요청당 최대 5개 그룹만 허용하므로, 호출 시 이 배열을 5개씩 나눠서 보낸다.
export const TREND_CATEGORIES: { name: string; keywords: string[] }[] = [
  { name: '재테크', keywords: ['재테크', '주식투자', '적금'] },
  { name: '부업', keywords: ['부업', '부수입', '재택부업'] },
  { name: '다이어트', keywords: ['다이어트', '홈트', '식단관리'] },
  { name: '반려동물', keywords: ['강아지', '고양이', '반려동물'] },
  { name: '자기계발', keywords: ['자기계발', '루틴', '아침루틴'] },
  { name: '뷰티', keywords: ['뷰티', '스킨케어', '메이크업'] },
  { name: '육아', keywords: ['육아', '이유식', '육아꿀팁'] },
  { name: '요리', keywords: ['자취요리', '집밥레시피', '간단요리'] },
];
