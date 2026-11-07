import test from "node:test";
import assert from "node:assert/strict";
import {kindOf,rankSimilar} from "../src/lib/taxonomy";
import type {Product} from "../src/lib/catalog";
const item=(id:string,name:string,category="Для двох",price=1000,brand=""):Product=>({id,name,description:"",category,price,brand,color:"#fff"});
test("cream for couples matches other creams, not couples vibrators",()=>{
 const cream=item("1","Стимулювальний крем для пар Dragon", "Догляд",900,"Shunga");
 const other=item("2","Крем стимулювальний Shunga", "Догляд",930,"Shunga");
 const toy=item("3","Вібратор для пар Double Whale", "Для двох",970,"Satisfyer");
 assert.equal(kindOf(cream),"Креми та косметика");
 assert.deepEqual(rankSimilar(cream,[toy,other]).map(p=>p.id),["2"]);
});
test("lubricants are separated from creams",()=>{
 const lubricant=item("1","Лубрикант на водній основі", "Догляд");
 const cream=item("2","Крем для масажу", "Догляд");
 const other=item("3","Лубрикант гель", "Догляд");
 assert.deepEqual(rankSimilar(lubricant,[cream,other]).map(p=>p.id),["3"]);
});
test("recommendations exclude products without a matching type",()=>{
 const base=item("1","Ексклюзивний товар", "Аксесуари");
 assert.deepEqual(rankSimilar(base,[item("2","Різні аксесуари")]),[]);
});
test("matched specifications improve the recommendation ranking",()=>{
 const base={...item("1","Лубрикант Aqua","Догляд",800),specs:{"Основа":"водна"}};
 const different={...item("2","Лубрикант B","Догляд",800),specs:{"Основа":"силіконова"}};
 const same={...item("3","Лубрикант C","Догляд",800),specs:{"Основа":"водна"}};
 assert.deepEqual(rankSimilar(base,[different,same]).map(p=>p.id),["3","2"]);
});
