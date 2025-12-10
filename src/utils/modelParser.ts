/**
 * 차량 모델명 파싱 유틸리티
 * 서버의 title_parser.py, model_matcher.py 로직과 동일하게 구현
 * search_tree.json을 기반으로 manufacturer_id, model_id, trim_id 매칭
 */

/** 트림 정보 인터페이스 */
interface Trim {
    id: string;
    trim: string;
}

/** 모델 정보 인터페이스 */
interface Model {
    id: string;
    model: string;
    trims: Trim[];
}

/** 제조사 정보 인터페이스 */
interface Manufacturer {
    id: string;
    label: string;
    models: Model[];
}

/** 검색 트리 데이터 인터페이스 */
interface SearchTreeData {
    domestic: Manufacturer[];
    import: Manufacturer[];
}

/** 모델 인덱스 엔트리 */
interface ModelIndexEntry {
    manufacturer: Manufacturer;
    model: Model;
}

/** 파싱 결과 인터페이스 */
export interface ParsedCarModel {
    manufacturerId: string | null;
    manufacturerName: string | null;
    modelId: string | null;
    modelName: string | null;
    trimId: string | null;
    trimName: string | null;
}

/** 제조사 추출 결과 */
interface ManufacturerExtractResult {
    label: string | null;
    remaining: string;
}

/** 디버그 파싱 결과 */
export interface ParsedCarModelDebug extends ParsedCarModel {
    original: string;
}

/** 모델명 디버그 결과 */
export interface ModelNameDebugResult {
    original: string;
    manufacturer: string | null;
    remaining: string;
    normalized: string;
    modelName: string | null;
}

// 캐시
let searchTreeData: SearchTreeData | null = null;
let manufacturerIndex: Record<string, Manufacturer> | null = null;
let modelIndex: Record<string, ModelIndexEntry[]> | null = null;

// 제조사 별명 → JSON label 매핑
const MANUFACTURER_LABEL_MAP: Record<string, string> = {
    // 국산
    "현대": "현대",
    "기아": "기아",
    "제네시스": "제네시스",
    "쉐보레": "쉐보레",
    "쉐보레(한국GM)": "쉐보레",
    "쉐보레(대우)": "쉐보레",
    "한국GM": "쉐보레",
    "르노삼성": "르노삼성",
    "르노(삼성)": "르노삼성",
    "르노코리아": "르노삼성",
    "KG모빌리티": "KG모빌리티",
    "KG모빌리티(쌍용)": "KG모빌리티",
    "쌍용": "KG모빌리티",

    // 수입 - 독일
    "벤츠": "벤츠",
    "메르세데스-벤츠": "벤츠",
    "메르세데스벤츠": "벤츠",
    "BMW": "BMW",
    "아우디": "아우디",
    "폭스바겐": "폭스바겐",
    "포르쉐": "포르쉐",
    "미니": "미니",

    // 수입 - 일본
    "토요타": "토요타",
    "도요타": "토요타",
    "렉서스": "렉서스",
    "혼다": "혼다",
    "닛산": "닛산",
    "스바루": "스바루",

    // 수입 - 미국
    "포드": "포드",
    "링컨": "링컨",
    "지프": "지프",
    "캐딜락": "캐딜락",
    "테슬라": "테슬라",
    "크라이슬러": "크라이슬러",

    // 수입 - 기타
    "볼보": "볼보",
    "랜드로버": "랜드로버",
    "재규어": "재규어",
    "마세라티": "마세라티",
    "푸조": "푸조",
};

// 모델명 변형 매핑
const MODEL_VARIATIONS: Record<string, string> = {
    // 현대
    "그랜져": "그랜저",
    "싼타페": "싼타페",
    "산타페": "싼타페",
    "투싼": "투싼",
    "투쌍": "투싼",
    "그랜드스타렉스": "스타렉스",
    "스타렉스": "스타렉스",
    "포터2": "포터",
    "포터II": "포터",

    // 기아
    "쏘렌토": "쏘렌토",
    "소렌토": "쏘렌토",
    "봉고3": "봉고",
    "봉고Ⅲ": "봉고",
    "봉고III": "봉고",

    // 벤츠
    "E-클래스": "E클래스",
    "C-클래스": "C클래스",
    "S-클래스": "S클래스",
    "A-클래스": "A클래스",
    "GLE-클래스": "GLE클래스",
    "GLC-클래스": "GLC클래스",
    "GLB-클래스": "GLB클래스",
    "GLA-클래스": "GLA클래스",
    "G-클래스": "G클래스",

    // 테슬라
    "모델 3": "모델3",
    "Model 3": "모델3",
    "Model3": "모델3",
    "모델 Y": "모델Y",
    "Model Y": "모델Y",
    "ModelY": "모델Y",
    "모델 S": "모델S",
    "Model S": "모델S",
    "모델 X": "모델X",
    "Model X": "모델X",
};

// 접두어 패턴 (제거 대상)
const PREFIX_PATTERNS: RegExp[] = [
    /^더\s*뉴\s*/,
    /^더뉴\s*/,
    /^올\s*뉴\s*/,
    /^디\s*올\s*뉴\s*/,
    /^신형\s*/,
    /^NEW\s+/i,
    /^뉴\s*/,
    /^NF\s+/i,
    /^LF\s+/i,
    /^YF\s+/i,
    /^THE\s+ALL\s+NEW\s+/i,
    /^THE\s+NEW\s+/i,
    /^ALL\s+NEW\s+/i,
];

/**
 * search_tree.json 로드
 */
async function loadSearchTree(): Promise<SearchTreeData | null> {
    if (searchTreeData) return searchTreeData;

    try {
        const response = await fetch(`${process.env.PUBLIC_URL}/data/search_tree.json`);
        if (!response.ok) throw new Error('Failed to load search_tree.json');
        searchTreeData = await response.json() as SearchTreeData;
        buildIndexes();
        return searchTreeData;
    } catch (error) {
        console.error('[modelParser] search_tree.json 로드 실패:', error);
        return null;
    }
}

/**
 * 인덱스 구축
 */
function buildIndexes(): void {
    if (!searchTreeData) return;

    manufacturerIndex = {};
    modelIndex = {};

    for (const category of ['domestic', 'import'] as const) {
        const manufacturers = searchTreeData[category] || [];
        for (const mfr of manufacturers) {
            const label = mfr.label;
            manufacturerIndex[label] = mfr;

            for (const model of mfr.models || []) {
                const modelName = model.model;
                if (!modelIndex[modelName]) {
                    modelIndex[modelName] = [];
                }
                modelIndex[modelName].push({ manufacturer: mfr, model });
            }
        }
    }
}

/**
 * 제조사 추출
 */
function extractManufacturer(title: string | null | undefined): ManufacturerExtractResult {
    if (!title) return { label: null, remaining: title || '' };

    // [제조사] 형태
    const bracketMatch = title.match(/^\[([^\]]+)\]\s*/);
    if (bracketMatch) {
        const raw = bracketMatch[1];
        const remaining = title.slice(bracketMatch[0].length);
        const label = MANUFACTURER_LABEL_MAP[raw] || raw;
        return { label, remaining };
    }

    // "제조사 모델명" 형태
    const parts = title.split(/\s+/);
    if (parts.length > 0) {
        const first = parts[0];
        // 괄호 포함 제조사
        const parenMatch = first.match(/^([^(]+)(\([^)]+\))?/);
        if (parenMatch) {
            const full = parenMatch[0];
            if (MANUFACTURER_LABEL_MAP[full]) {
                return {
                    label: MANUFACTURER_LABEL_MAP[full],
                    remaining: parts.slice(1).join(' '),
                };
            }
            const base = parenMatch[1];
            if (MANUFACTURER_LABEL_MAP[base]) {
                return {
                    label: MANUFACTURER_LABEL_MAP[base],
                    remaining: parts.slice(1).join(' '),
                };
            }
        }
    }

    return { label: null, remaining: title };
}

/**
 * 모델명 텍스트 정규화
 */
function normalizeModelText(text: string | null | undefined): string {
    if (!text) return '';

    let result = text;

    // 접두어 제거
    for (const pattern of PREFIX_PATTERNS) {
        result = result.replace(pattern, '');
    }

    // 연식 정보 제거
    result = result.replace(/\(\d{2}년~[^)]+\)/g, '');
    // 세대 코드 제거
    result = result.replace(/\([A-Z]{1,3}\d{1,3}\)/g, '');
    result = result.replace(/\(DM\)|\(DN8\)|\(CN7\)|\(NX4\)|\(MQ4\)|\(RG3\)|\(G\)/g, '');
    // 배기량 제거
    result = result.replace(/\d{3,4}\s*cc/gi, '');
    result = result.replace(/\d\.\d\s*(터보|T)?/g, '');

    return result.replace(/\s+/g, ' ').trim();
}

/**
 * 모델 찾기
 */
function findModel(text: string, manufacturerLabel: string | null): ModelIndexEntry | null {
    if (!modelIndex) return null;

    const normalized = normalizeModelText(text);

    // 1. 정확한 모델명 매칭
    for (const [modelName, entries] of Object.entries(modelIndex)) {
        if (normalized.includes(modelName) || text.includes(modelName)) {
            if (manufacturerLabel) {
                const match = entries.find(e => e.manufacturer.label === manufacturerLabel);
                if (match) return match;
            }
            return entries[0];
        }
    }

    // 2. 변형 모델명으로 매칭
    for (const [variation, canonical] of Object.entries(MODEL_VARIATIONS)) {
        if (normalized.includes(variation) || text.includes(variation)) {
            if (modelIndex[canonical]) {
                const entries = modelIndex[canonical];
                if (manufacturerLabel) {
                    const match = entries.find(e => e.manufacturer.label === manufacturerLabel);
                    if (match) return match;
                }
                return entries[0];
            }
        }
    }

    // 3. 첫 단어로 매칭
    const firstWord = normalized.split(/\s+/)[0];
    if (firstWord) {
        const canonical = MODEL_VARIATIONS[firstWord] || firstWord;
        if (modelIndex[canonical]) {
            const entries = modelIndex[canonical];
            if (manufacturerLabel) {
                const match = entries.find(e => e.manufacturer.label === manufacturerLabel);
                if (match) return match;
            }
            return entries[0];
        }
    }

    return null;
}

/**
 * 트림 연식 추출
 */
function extractTrimYear(trimName: string): string | null {
    const match = trimName.match(/\((\d{2})년~[^)]+\)/);
    return match ? match[1] : null;
}

/**
 * 제목에서 연식 추출
 */
function extractYearFromTitle(title: string): string | null {
    const match = title.match(/\((\d{2})년~[^)]+\)/);
    return match ? match[1] : null;
}

/**
 * 최적 트림 찾기
 */
function findBestTrim(trims: Trim[] | undefined, title: string): Trim | null {
    if (!trims || trims.length === 0) return null;

    const titleYear = extractYearFromTitle(title);
    let bestTrim: Trim | null = null;
    let bestScore = -1;

    for (const trim of trims) {
        let score = 0;
        const trimYear = extractTrimYear(trim.trim);

        // 연식 매칭
        if (trimYear && titleYear) {
            if (titleYear === trimYear) {
                score += 10;
            } else if (Math.abs(parseInt(titleYear) - parseInt(trimYear)) <= 2) {
                score += 5;
            }
        }

        // 키워드 매칭
        const keywords = ['하이브리드', 'N', '일렉트릭', '플러그인', 'PHEV'];
        for (const kw of keywords) {
            if (title.includes(kw) && trim.trim.includes(kw)) {
                score += 3;
            } else if (title.includes(kw) && !trim.trim.includes(kw)) {
                score -= 2;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestTrim = trim;
        }
    }

    return bestTrim || trims[0];
}

/**
 * 차량 제목에서 manufacturer_id, model_id, trim_id 추출
 * 서버의 match_car_model() 함수와 동일한 로직
 */
export async function parseCarModel(title: string | null | undefined): Promise<ParsedCarModel> {
    const result: ParsedCarModel = {
        manufacturerId: null,
        manufacturerName: null,
        modelId: null,
        modelName: null,
        trimId: null,
        trimName: null,
    };

    if (!title) return result;

    // search_tree.json 로드
    await loadSearchTree();
    if (!searchTreeData) return result;

    // 1. 제조사 추출
    const { label: mfrLabel, remaining } = extractManufacturer(title);

    // 2. 제조사 정보 조회
    if (mfrLabel && manufacturerIndex && manufacturerIndex[mfrLabel]) {
        const mfr = manufacturerIndex[mfrLabel];
        result.manufacturerId = mfr.id;
        result.manufacturerName = mfr.label;
    }

    // 3. 모델 찾기
    let modelMatch = findModel(remaining, mfrLabel);
    if (!modelMatch && mfrLabel) {
        modelMatch = findModel(title, mfrLabel);
    }

    if (modelMatch) {
        const { manufacturer, model } = modelMatch;

        if (!result.manufacturerId) {
            result.manufacturerId = manufacturer.id;
            result.manufacturerName = manufacturer.label;
        }

        result.modelId = model.id;
        result.modelName = model.model;

        // 4. 트림 찾기
        const bestTrim = findBestTrim(model.trims, title);
        if (bestTrim) {
            result.trimId = bestTrim.id;
            result.trimName = bestTrim.trim;
        }
    }

    return result;
}

/**
 * 디버그용: 파싱 과정 전체 출력
 */
export async function parseCarModelDebug(title: string): Promise<ParsedCarModelDebug> {
    const result = await parseCarModel(title);

    return {
        original: title,
        ...result,
    };
}

/**
 * 이전 버전 호환용 (deprecated)
 */
export function parseModelName(title: string | null | undefined): string | null {
    if (!title) return null;

    const { remaining } = extractManufacturer(title);
    const normalized = normalizeModelText(remaining || title);

    // 변형 매핑에서 확인
    for (const [variation, canonical] of Object.entries(MODEL_VARIATIONS)) {
        if (normalized.includes(variation)) {
            return canonical;
        }
    }

    // 첫 단어 반환
    const firstWord = normalized.split(/\s+/)[0];
    return MODEL_VARIATIONS[firstWord] || firstWord || null;
}

export function parseModelNameDebug(title: string): ModelNameDebugResult {
    const { label: manufacturer, remaining } = extractManufacturer(title);
    const normalized = normalizeModelText(remaining || title);
    const modelName = parseModelName(title);

    return {
        original: title,
        manufacturer,
        remaining,
        normalized,
        modelName,
    };
}
