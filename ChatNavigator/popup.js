let extractedContent = null;

function extractArticleContent() {
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
}

function addMessageToChat(message, isUser = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loadingIndicator';
    loadingElement.textContent = 'Procesando...';
    loadingElement.style.textAlign = 'center';
    loadingElement.style.fontStyle = 'italic';
    document.getElementById('chatContainer').appendChild(loadingElement);
}

function removeLoadingIndicator() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

async function sendMessage(message) {
    try {
        addMessageToChat(message, true);
        showLoadingIndicator();

        if (!extractedContent) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractArticleContent
            });

            if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                extractedContent = injectionResults[0].result;
                console.log('Extracted content:', extractedContent);
            } else {
                throw new Error('No se pudo extraer el contenido del artículo.');
            }
        }

        const fullContent = `
            Título: ${extractedContent.title}
            
            Subtítulo: ${extractedContent.subtitle}
            
            Descripción de imagen: ${extractedContent.imageCaption}
            
            Contenido:
            ${extractedContent.content}

            Pregunta del usuario: ${message}
        `.trim();

        const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: fullContent })
        });

        if (!response.ok) {
            throw new Error('Error in API call: ' + response.statusText);
        }

        const data = await response.json();
        removeLoadingIndicator();
        addMessageToChat(data.response || 'No se generó respuesta.');
    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator();
        addMessageToChat('Error: ' + error.message);
    }
}

document.getElementById('sendBtn').addEventListener('click', () => {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
        userInput.value = '';
    }
});

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('sendBtn').click();
    }
});

// Función para limpiar el chat
function clearChat() {
    document.getElementById('chatContainer').innerHTML = '';
    extractedContent = null;
}

// Agregar botón para limpiar el chat
const clearButton = document.createElement('button');
clearButton.textContent = 'Limpiar Chat';
clearButton.style.marginTop = '10px';
clearButton.addEventListener('click', clearChat);
document.body.appendChild(clearButton);