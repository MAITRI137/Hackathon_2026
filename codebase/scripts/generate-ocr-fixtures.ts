import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const output=join(process.cwd(),"demo","receipts");
const receipts=[
  ["fuel-receipt-clean.png","BHARAT PETROLEUM","Receipt No: BP-2048","Date: 12/07/2026","Vehicle: MH-12-AB-1234","Litres: 23.50","Rate: 103.00","Tax: 120.00","TOTAL: 2540.50"],
  ["fuel-receipt-tilted.png","INDIAN OIL","Receipt No: IO-8821","Date: 12/07/2026","Vehicle: GJ-01-MN-3344","Litres: 40.00","Rate: 102.40","Tax: 190.00","TOTAL: 4286.00"],
  ["toll-receipt.png","NATIONAL HIGHWAY TOLL","Receipt No: TOLL-901","Date: 12/07/2026","Vehicle: MH-12-AB-1234","Category: Toll","TOTAL: 620.00"],
  ["maintenance-invoice.png","METRO FLEET CARE","Invoice No: MFC-771","Date: 12/07/2026","Vehicle: MH-12-CD-5678","Service: Engine Repair","Tax: 2745.76","TOTAL: 18000.00"],
];
async function main(){await mkdir(output,{recursive:true});for(const [filename,...lines] of receipts){const svg=`<svg width="760" height="980" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f7f2e7"/><text x="70" y="110" font-family="monospace" font-size="34" fill="#202018">${lines.map((line,index)=>`<tspan x="70" dy="${index?82:0}">${line}</tspan>`).join("")}</text></svg>`;let image=sharp(Buffer.from(svg)).rotate(filename.includes("tilted")?1.7:0,{background:"#f7f2e7"});if(filename.includes("tilted"))image=image.blur(.35);await image.png().toFile(join(output,filename));}console.log(`Generated ${receipts.length} OCR demo receipts in ${output}`);}
main().catch(error=>{console.error(error);process.exit(1)});
