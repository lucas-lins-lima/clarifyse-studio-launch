import requests
import json
import uuid
from datetime import datetime

# Configurações do Supabase (do seu arquivo .env)
SUPABASE_URL = "https://rbjrpzmsrygvkpdvnzsh.supabase.co"
# Nota: Precisamos da Service Role Key para criar usuários via API, 
# mas como não temos, vamos sugerir ao usuário como fazer isso ou usar a sua planilha.
# No entanto, o seu código já redireciona as tabelas para o Google Sheets.

def create_admin_row():
    # Esta função simula o que o seu sistema faria se você estivesse logado.
    # Como a planilha está pública, a melhor forma é você adicionar manualmente,
    # mas vou gerar os dados exatos para você copiar e colar.
    
    admin_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    data = {
        "id": admin_id,
        "name": "Administrador",
        "email": "clarifysestrategyresearch@gmail.com",
        "role": "admin",
        "status": "active",
        "empresa": "Clarifyse",
        "cargo": "CEO",
        "first_access_done": "TRUE",
        "must_change_password": "FALSE",
        "created_at": now,
        "updated_at": now
    }
    
    print("\n=== DADOS PARA ADICIONAR NA PLANILHA (ABA profiles) ===")
    print("Copie e cole estes valores na linha 2 da sua planilha:\n")
    print("\t".join(data.keys()))
    print("\t".join([str(v) for v in data.values()]))
    print("\n=======================================================\n")

if __name__ == "__main__":
    create_admin_row()
