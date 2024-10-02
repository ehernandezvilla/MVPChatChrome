import google.generativeai as genai
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging
from typing import List

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(level=logging.DEBUG)

# Set your Google API Key from environment variable
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
logging.info(f"API Key configured: {'Yes' if GOOGLE_API_KEY else 'No'}")
genai.configure(api_key=GOOGLE_API_KEY)

@app.route('/')
def index():
    return 'Hello, World!'

def split_text(text: str, max_length: int) -> List[str]:
    """Divide el texto en chunks de tamaño máximo max_length."""
    return [text[i:i+max_length] for i in range(0, len(text), max_length)]

@app.route('/generate', methods=['POST'])
def generate():
    user_input = request.json.get('inputs', '')
    logging.info(f"Received input length: {len(user_input)}")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        
        # Establecer un límite predeterminado de tokens
        default_token_limit = 90000  # Este es un valor aproximado, ajusta según sea necesario
        
        # Intentar obtener el límite de tokens del modelo si es posible
        try:
            token_count_response = model.count_tokens(user_input)
            if hasattr(token_count_response, 'total_tokens'):
                model_token_limit = token_count_response.total_tokens
            else:
                logging.warning("Unable to get token count from model response, using default limit.")
                model_token_limit = default_token_limit
        except Exception as e:
            logging.warning(f"Error getting token count: {str(e)}. Using default limit.")
            model_token_limit = default_token_limit
        
        # Logging para el límite de tokens
        logging.info(f"Token limit: {model_token_limit}")
        
        # Estimar el número de caracteres por token (esto puede variar, ajusta según sea necesario)
        chars_per_token = 10
        
        # Calcular el máximo de caracteres permitidos (dejando espacio para el prompt)
        max_input_length = (default_token_limit - 100) * chars_per_token  # 100 tokens para el prompt
        
        if len(user_input) > max_input_length:
            logging.warning(f"Input exceeds {max_input_length} characters. Splitting into chunks...")
            chunks = split_text(user_input, max_input_length)
        else:
            chunks = [user_input]
        
        # Logging para los chunks
        logging.info(f"Number of chunks: {len(chunks)}")
        for i, chunk in enumerate(chunks):
            logging.info(f"Processing chunk {i+1}, length: {len(chunk)}")
        
        summaries = []
        for i, chunk in enumerate(chunks):
            prompt = f"""
            Basándote en el siguiente fragmento de artículo (parte {i+1} de {len(chunks)}), 
            proporciona una respuesta a la pregunta planteada.
            
            {chunk}
            """
            
            response = model.generate_content(prompt)
            logging.info(f"Response received for chunk {i+1}")
            
            if hasattr(response, 'text'):
                summaries.append(response.text)
                logging.info(f"Summary added for chunk {i+1}, length: {len(response.text)}")
            else:
                logging.warning(f"No text in response for chunk {i+1}")
        
        # Combinar los resúmenes si hay múltiples chunks
        if len(summaries) > 1:
            logging.info("Combining multiple summaries")
            final_prompt = f"""
            Combina los siguientes resúmenes en un único resumen coherente:
            
            {' '.join(summaries)}
            """
            final_response = model.generate_content(final_prompt)
            final_summary = final_response.text if hasattr(final_response, 'text') else "No se pudo generar un resumen final."
            logging.info(f"Final summary generated, length: {len(final_summary)}")
        else:
            final_summary = summaries[0] if summaries else "No se pudo generar un resumen."
            logging.info(f"Single summary used, length: {len(final_summary)}")
        
        return jsonify({"response": final_summary})
    except Exception as e:
        logging.error(f"Error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)