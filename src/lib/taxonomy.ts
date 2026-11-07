import type {Product} from "./catalog";
export const types=[
{label:"Кліторальні стимулятори",regex:/клітор|clitoral|womanizer|повітрян.*стимул/i,sql:"клітор|clitoral|womanizer|повітрян"},
{label:"Для пар",regex:/для пар|парн.*вібратор|couple|парн.*стимулятор/i,sql:"для пар|парн.*вібратор|couple|парн.*стимулятор"},
{label:"Лубриканти",regex:/лубрикант|змазк|мастил|lubricant|гель.*інтим/i,sql:"лубрикант|змазк|мастил|lubricant|гель.*інтим"},
{label:"Креми та косметика",regex:/крем|cream|масажн.*ол|massage oil|лосьйон|косметик/i,sql:"крем|cream|масажн.*ол|massage oil|лосьйон|косметик"},
{label:"Презервативи",regex:/презерватив|condom/i,sql:"презерватив|condom"},
{label:"Білизна",regex:/білизн|белье|панчох|боді|трусик|lingerie|corset/i,sql:"білизн|белье|панчох|боді|трусик|lingerie|corset"},
{label:"Для чоловіків",regex:/мастурбатор|простата|penis|чоловіч.*стимул/i,sql:"мастурбатор|простата|penis|чоловіч.*стимул"},
{label:"Набори",regex:/набір|набор|комплект|kit|gift set/i,sql:"набір|набор|комплект|kit|gift set"},
{label:"БДСМ аксесуари",regex:/наручник|пов'язк|маск.*оч|bdsm|батіг|плетк/i,sql:"наручник|пов'язк|маск.*оч|bdsm|батіг|плетк"},
{label:"Вібратори",regex:/вібратор|vibrator|вібромасажер|вібростимул/i,sql:"вібратор|vibrator|вібромасажер|вібростимул"}
];
types.push(
 {label:"Фалоімітатори",regex:/фалоімітатор|дилдо|dildo/i,sql:"фалоімітатор|дилдо|dildo"},
 {label:"Анальні товари",regex:/анальн|анальна пробк|anal plug|butt plug/i,sql:"анальн|анальна пробк|anal plug|butt plug"}
);
export const shopCategories=["Усі","Для неї","Для нього","Для двох","Догляд","Аксесуари",...types.map(t=>t.label)];
export const kindOf=(p:Pick<Product,"name"|"description">):string=>{
 const order=["Презервативи","Лубриканти","Креми та косметика","Білизна","Для чоловіків","Кліторальні стимулятори","БДСМ аксесуари","Для пар","Набори","Фалоімітатори","Анальні товари","Вібратори"];
 for(const key of order){const t=types.find(t=>t.label===key);if(t?.regex.test(p.name))return key}
 for(const key of order){const t=types.find(t=>t.label===key);if(t?.regex.test(p.description.slice(0,120)))return key}
 return "Інше";
};
const stop=new Set(["для","and","the","мл","гель","набір","новий","чорний","білий"]);
function words(p:Product){return new Set((p.name+" "+(p.brand||"")).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3&&!stop.has(w)))}
export function rankSimilar(base:Product,candidates:Product[],limit=6):Product[]{
 const family=kindOf(base);if(family==="Інше")return [];
 const baseWords=words(base);
 return candidates.filter(p=>p.id!==base.id&&kindOf(p)===family).map(p=>{
  const tokens=words(p);let score=0;for(const w of baseWords)if(tokens.has(w))score+=3;
  if(base.brand&&p.brand&&base.brand.toLowerCase()===p.brand.toLowerCase())score+=15;
  if(p.category===base.category)score+=8;
  // Equivalent supplier specifications improve relevance within a product family.
  const a=Object.entries(base.specs||{}).filter(([k,v])=>k&&v).map(([k,v])=>[k.toLocaleLowerCase("uk-UA").trim(),v.toLocaleLowerCase("uk-UA").trim()]);
  const b=new Map(Object.entries(p.specs||{}).filter(([k,v])=>k&&v).map(([k,v])=>[k.toLocaleLowerCase("uk-UA").trim(),v.toLocaleLowerCase("uk-UA").trim()]));
  for(const [key,value] of a){
   const candidate=b.get(key);
   if(candidate&&candidate===value)score+=7;
   else if(candidate&&value.length>5&&(candidate.includes(value)||value.includes(candidate)))score+=3;
  }
  score+=Math.max(0,18-12*Math.abs(Math.log(Math.max(1,p.price)/Math.max(1,base.price))));
  if(p.image)score+=2;
  return {p,score};
 }).sort((a,b)=>b.score-a.score||a.p.price-b.p.price).slice(0,limit).map(x=>x.p);
}