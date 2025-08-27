import { existsSync } from 'node:fs'
import { join } from 'path'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

export const getNamedFunctionCountData3 = async (name: string) => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'named-function-count3')
  if (!existsSync(resultsPath)) {
    return []
  }
  const beforePath = join(resultsPath, 'editor.no-autofixes-available.json')
  const rawData = await readJson(beforePath)

  const data = rawData.namedFunctionCount3.map((item) => {
    return {
      name: item.name,
      value: item.count,
    }
  })

  if (Math) {
    return data
  }

  console.log({ data })
  return [
    { name: 'Apple', value: 214480 },
    { name: 'Google', value: 155506 },
    { name: 'Amazon', value: 100764 },
    { name: 'Microsoft', value: 92715 },
    { name: 'Coca-Cola', value: 66341 },
    { name: 'Samsung', value: 59890 },
    { name: 'Toyota', value: 53404 },
    { name: 'Mercedes-Benz', value: 48601 },
    { name: 'Facebook', value: 45168 },
    { name: "McDonald's", value: 43417 },
    { name: 'Intel', value: 43293 },
    { name: 'IBM', value: 42972 },
    { name: 'BMW', value: 41006 },
    { name: 'Disney', value: 39874 },
    { name: 'Cisco', value: 34575 },
    { name: 'GE', value: 32757 },
    { name: 'Nike', value: 30120 },
    { name: 'Louis Vuitton', value: 28152 },
    { name: 'Oracle', value: 26133 },
    { name: 'Honda', value: 23682 },
    { name: 'SAP', value: 22885 },
    { name: 'Pepsi', value: 20798 },
    { name: 'Chanel', value: 20005 },
    { name: 'American Express', value: 19139 },
    { name: 'Zara', value: 17712 },
    { name: 'J.P. Morgan', value: 17567 },
    { name: 'IKEA', value: 17458 },
    { name: 'Gillette', value: 16864 },
    { name: 'UPS', value: 16849 },
    { name: 'H&M', value: 16826 },
    { name: 'Pampers', value: 16617 },
    { name: 'Hermès', value: 16372 },
    { name: 'Budweiser', value: 15627 },
    { name: 'Accenture', value: 14214 },
    { name: 'Ford', value: 13995 },
    { name: 'Hyundai', value: 13535 },
    { name: 'NESCAFÉ', value: 13053 },
    { name: 'eBay', value: 13017 },
    { name: 'Gucci', value: 12942 },
    { name: 'Nissan', value: 12213 },
    { name: 'Volkswagen', value: 12201 },
    { name: 'Audi', value: 12187 },
    { name: 'Philips', value: 12104 },
    { name: 'Goldman Sachs', value: 11769 },
    { name: 'Citi', value: 11577 },
    { name: 'HSBC', value: 11208 },
    { name: 'AXA', value: 11118 },
    { name: "L'Oréal", value: 11102 },
    { name: 'Allianz', value: 10821 },
    { name: 'adidas', value: 10772 },
    { name: 'Adobe', value: 10748 },
    { name: 'Porsche', value: 10707 },
    { name: "Kellogg's", value: 10634 },
    { name: 'HP', value: 10433 },
    { name: 'Canon', value: 10380 },
    { name: 'Siemens', value: 10132 },
    { name: 'Starbucks', value: 9615 },
    { name: 'Danone', value: 9533 },
    { name: 'Sony', value: 9316 },
    { name: '3M', value: 9104 },
    { name: 'Visa', value: 9021 },
    { name: 'Nestlé', value: 8938 },
    { name: 'Morgan Stanley', value: 8802 },
    { name: 'Colgate', value: 8659 },
    { name: 'Hewlett Packard Enterprise', value: 8157 },
    { name: 'Netflix', value: 8111 },
    { name: 'Cartier', value: 7646 },
    { name: 'Huawei', value: 7578 },
    { name: 'Banco Santander', value: 7547 },
    { name: 'Mastercard', value: 7545 },
    { name: 'Kia', value: 6925 },
    { name: 'FedEx', value: 6890 },
    { name: 'PayPal', value: 6621 },
    { name: 'LEGO', value: 6533 },
    { name: 'Salesforce.com', value: 6432 },
    { name: 'Panasonic', value: 6293 },
    { name: 'Johnson & Johnson', value: 6231 },
    { name: 'Land Rover', value: 6221 },
    { name: 'DHL', value: 5881 },
    { name: 'Ferrari', value: 5760 },
    { name: 'Discovery', value: 5755 },
    { name: 'Caterpillar', value: 5730 },
    { name: 'Tiffany & Co.', value: 5642 },
    { name: "Jack Daniel's", value: 5641 },
    { name: 'Corona', value: 5517 },
    { name: 'KFC', value: 5481 },
    { name: 'Heineken', value: 5393 },
    { name: 'John Deere', value: 5375 },
    { name: 'Shell', value: 5276 },
    { name: 'MINI', value: 5254 },
    { name: 'Dior', value: 5223 },
    { name: 'Spotify', value: 5176 },
    { name: 'Harley-Davidson', value: 5161 },
    { name: 'Burberry', value: 4989 },
    { name: 'Prada', value: 4812 },
    { name: 'Sprite', value: 4733 },
    { name: 'Johnnie Walker', value: 4731 },
    { name: 'Hennessy', value: 4722 },
    { name: 'Nintendo', value: 4696 },
    { name: 'Subaru', value: 4214 },
  ]
}
