const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractArticleContent(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const extractedContent = await page.evaluate(() => {
        const cleanText = (text) => text.trim().replace(/\s+/g, ' ');

        const extractElementText = (selector) => {
            const element = document.querySelector(selector);
            return element ? cleanText(element.innerText) : '';
        };

        const title = extractElementText('#cuDetalle_cuTitular_tituloNoticia');
        const subtitle = extractElementText('#cuDetalle_cuTitular_bajadaNoticia');
        const imageCaption = extractElementText('#cuDetalle_cuTexto_ucImagen_bajada');

        const contentElement = document.querySelector('#cuDetalle_cuTexto_textoNoticia');
        let content = '';
        if (contentElement) {
            content = Array.from(contentElement.childNodes)
                .map(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return cleanText(node.textContent);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'BR') {
                            return '\n';
                        } else if (node.tagName === 'DIV' || node.tagName === 'P') {
                            return '\n' + cleanText(node.innerText) + '\n';
                        } else {
                            return cleanText(node.innerText);
                        }
                    }
                    return '';
                })
                .join('')
                .replace(/\n{3,}/g, '\n\n');
        }

        return { title, subtitle, imageCaption, content };
    });

    await browser.close();

    return extractedContent;
}

async function main() {
    const url = 'https://www.emol.com/noticias/Espectaculos/2024/10/02/1144299/resumen-caso-diddy-preso-abuso.html';
    const content = await extractArticleContent(url);

    console.log('Extracted content:', content);
    console.log('Total length:', JSON.stringify(content).length);

    // Guardar el contenido en un archivo JSON
    fs.writeFileSync('extracted_content.json', JSON.stringify(content, null, 2));
    console.log('Content saved to extracted_content.json');

    // Imprimir los primeros 500 caracteres del contenido
    console.log('First 500 characters of content:', content.content.substring(0, 500));
}

main().catch(console.error);