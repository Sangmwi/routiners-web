export type UnitType = 'BRIGADE' | 'REGIMENT';

export interface Unit {
  id: string; // uuid or stable slug
  name: string; // 제23교육연대
  type: UnitType;
  region: string;
  isActive: boolean;
}

export const UNITS: Unit[] = [
  {
    id: 'grd-300',
    name: '제300경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-301',
    name: '제301경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-302',
    name: '제302경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-303',
    name: '제303경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-305',
    name: '제305경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-306',
    name: '제306경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'grd-308',
    name: '제308경비연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'inf-002',
    name: '제2보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-003',
    name: '제3보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-005',
    name: '제5보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-007',
    name: '제7보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-008',
    name: '제8보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-011',
    name: '제11보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-012',
    name: '제12보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-015',
    name: '제15보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-017',
    name: '제17보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-018',
    name: '제18보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-019',
    name: '제19보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-022',
    name: '제22보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-023',
    name: '제23보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-027',
    name: '제27보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-028',
    name: '제28보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-029',
    name: '제29보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-030',
    name: '제30보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-031',
    name: '제31보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-032',
    name: '제32보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-035',
    name: '제35보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-036',
    name: '제36보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-037',
    name: '제37보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-038',
    name: '제38보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-039',
    name: '제39보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-050',
    name: '제50보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-051',
    name: '제51보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-052',
    name: '제52보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-053',
    name: '제53보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-055',
    name: '제55보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-056',
    name: '제56보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-057',
    name: '제57보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-058',
    name: '제58보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-059',
    name: '제59보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-063',
    name: '제63보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-065',
    name: '제65보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-066',
    name: '제66보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-070',
    name: '제70보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-071',
    name: '제71보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-072',
    name: '제72보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-077',
    name: '제77보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-078',
    name: '제78보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-079',
    name: '제79보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-080',
    name: '제80보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-081',
    name: '제81보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-082',
    name: '제82보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-093',
    name: '제93보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-095',
    name: '제95보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-096',
    name: '제96보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-097',
    name: '제97보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-098',
    name: '제98보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-099',
    name: '제99보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-100',
    name: '제100보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-101',
    name: '제101보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-102',
    name: '제102보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-103',
    name: '제103보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-105',
    name: '제105보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-106',
    name: '제106보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-107',
    name: '제107보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-108',
    name: '제108보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-109',
    name: '제109보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-110',
    name: '제110보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-111',
    name: '제111보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-112',
    name: '제112보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-113',
    name: '제113보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-115',
    name: '제115보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-116',
    name: '제116보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-117',
    name: '제117보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-118',
    name: '제118보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-119',
    name: '제119보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-120',
    name: '제120보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-121',
    name: '제121보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-122',
    name: '제122보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-123',
    name: '제123보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-125',
    name: '제125보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-126',
    name: '제126보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-127',
    name: '제127보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-160',
    name: '제160보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-161',
    name: '제161보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-162',
    name: '제162보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-163',
    name: '제163보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-165',
    name: '제165보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-166',
    name: '제166보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-167',
    name: '제167보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-168',
    name: '제168보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-169',
    name: '제169보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-170',
    name: '제170보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-171',
    name: '제171보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-172',
    name: '제172보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-177',
    name: '제177보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-178',
    name: '제178보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-179',
    name: '제179보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-183',
    name: '제183보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-185',
    name: '제185보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-186',
    name: '제186보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-187',
    name: '제187보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-188',
    name: '제188보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-189',
    name: '제189보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-200',
    name: '제200보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-201',
    name: '제201보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-202',
    name: '제202보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-203',
    name: '제203보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-205',
    name: '제205보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-206',
    name: '제206보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-207',
    name: '제207보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-208',
    name: '제208보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-209',
    name: '제209보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-210',
    name: '제210보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-211',
    name: '제211보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-212',
    name: '제212보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-213',
    name: '제213보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-215',
    name: '제215보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-218',
    name: '제218보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-219',
    name: '제219보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-220',
    name: '제220보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-221',
    name: '제221보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'inf-223',
    name: '제223보병연대',
    type: 'REGIMENT',
    region: '',
    isActive: false
  },
  {
    id: 'sf-700',
    name: '제700특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'sf-701',
    name: '제701특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'sf-702',
    name: '제702특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'sf-703',
    name: '제703특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'sf-705',
    name: '제705특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'sf-706',
    name: '제706특공연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-023',
    name: '제23교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-025',
    name: '제25교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-026',
    name: '제26교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-027',
    name: '제27교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-028',
    name: '제28교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-029',
    name: '제29교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'trn-030',
    name: '제30교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'ttr-001',
    name: '제1수송교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'ttr-002',
    name: '제2수송교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'ttr-003',
    name: '제3수송교육연대',
    type: 'REGIMENT',
    region: '',
    isActive: true
  },
  {
    id: 'b-ad-001',
    name: '제1방공여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-001',
    name: '제1기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-002',
    name: '제2기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-003',
    name: '제3기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-005',
    name: '제5기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-020',
    name: '제20기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-arm-030',
    name: '제30기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: false
  },
  {
    id: 'b-arm-102',
    name: '제102기갑여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-001',
    name: '제1포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-002',
    name: '제2포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-003',
    name: '제3포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-005',
    name: '제5포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-006',
    name: '제6포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-007',
    name: '제7포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-art-capital-artillery',
    name: '수도포병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-av-001',
    name: '제1항공여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-av-002',
    name: '제2항공여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-cmd-201',
    name: '제201특공여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-cmd-203',
    name: '제203특공여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-cmd-205',
    name: '제205특공여단',
    type: 'BRIGADE',
    region: '',
    isActive: false
  },
  {
    id: 'b-eng-001',
    name: '제1공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-eng-002',
    name: '제2공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-eng-003',
    name: '제3공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-eng-005',
    name: '제5공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-eng-006',
    name: '제6공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-eng-007',
    name: '제7공병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-inf-501',
    name: '제501보병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-inf-503',
    name: '제503보병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-inf-505',
    name: '제505보병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-inf-507',
    name: '제507보병여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-log-001',
    name: '제1군수지원여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-log-002',
    name: '제2군수지원여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-log-003',
    name: '제3군수지원여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-log-005',
    name: '제5군수지원여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sig-signal',
    name: '정보통신여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sm-013',
    name: '제13특수임무여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sw-001',
    name: '제1공수특전여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sw-003',
    name: '제3공수특전여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sw-007',
    name: '제7공수특전여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sw-009',
    name: '제9공수특전여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-sw-011',
    name: '제11공수특전여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-trn-army-mechanized-school-training',
    name: '육군기계화학교 교육여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-trn-army-infantry-school-training',
    name: '육군보병학교 교육여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  },
  {
    id: 'b-trn-army-artillery-school-training',
    name: '육군포병학교 교육여단',
    type: 'BRIGADE',
    region: '',
    isActive: true
  }
];
