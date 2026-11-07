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
export const shopCategories=["Усі","Для неї","Для нього","Для двох","Догляд","Аксесуари",...types.map(t=>t.label)];
export const kindOf=(p:Pick<Product,"name"|"description">):string=>types.find(t=>t.regex.test(p.name))?.label||types.find(t=>t.regex.test(p.description.slice(0,120)))?.label||"Інше";
const stop=new Set(["для","and","the","мл","гель","набір","новий","чорний","білий"]);
function words(p:Product){return new Set((p.name+" "+(p.brand||"")).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3&&!stop.has(w)))}
export function rankSimilar(base:Product,candidates:Product[],limit=6):Product[]{
 const family=kindOf(base);if(family==="Інше")return [];
 const baseWords=words(base);
 return candidates.filter(p=>p.id!==base.id&&kindOf(p)===family).map(p=>{
  const tokens=words(p);let score=0;for(const w of baseWords)if(tokens.has(w))score+=3;
  if(base.brand&&p.brand&&base.brand.toLowerCase()===p.brand.toLowerCase())score+=15;
  if(p.category===base.category)score+=8;
  score+=Math.max(0,18-12*Math.abs(Math.log(Math.max(1,p.price)/Math.max(1,base.price))));
  if(p.image)score+=2;
  return {p,score};
 }).sort((a,b)=>b.score-a.score||a.p.price-b.p.price).slice(0,limit).map(x=>x.p);
}