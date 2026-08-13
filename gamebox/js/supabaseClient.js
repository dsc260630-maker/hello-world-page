// Supabase 프로젝트 연결
// 여기 있는 키는 공개(publishable) 키로, 클라이언트에 노출돼도 안전합니다.
// 실제 접근 제어는 DB의 RLS(행 단위 보안) 정책이 담당합니다.
const SUPABASE_URL = 'https://cvtswzemhqtxhghgoadd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oti0p5rEUN-s8M8zumRrgA_g-X17h72';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
