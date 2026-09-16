import os
import fnmatch

# Configurações
root_dir = "."

output_file = "projeto.txt"

ignore_dirs = {
    "target", ".git", ".idea", ".settings", "node_modules",
    "bin", "logs", "dist", "build", ".vscode", "webjars"
}

include_extensions = {
    ".java", ".jsp", ".jspx", ".xml", ".properties", ".yml",
    ".sql", ".md", ".txt", ".bat", ".cmd", ".sh", ".gradle",
    ".ts",
    ".groovy", ".mf"
}

def should_ignore(path):
    parts = path.split(os.sep)
    for part in parts:
        if part in ignore_dirs:
            return True
    return False

def list_files(start_dir):
    files = []
    for root, dirs, filenames in os.walk(start_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for filename in filenames:
            file_path = os.path.join(root, filename)
            if should_ignore(file_path):
                continue
            ext = os.path.splitext(filename)[1].lower()
            if ext in include_extensions:
                files.append(file_path)
    return sorted(files)

def main():
    if not os.path.exists(root_dir):
        print(f"Erro: Diretório '{root_dir}' não encontrado.")
        return

    print("🔍 Coletando arquivos...")
    files = list_files(root_dir)
    print(f"📄 Encontrados {len(files)} arquivos para processar.")

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("PROJETO - ESTRUTURA E CONTEÚDO\n\n")
        out.write("ESTRUTURA DE PASTAS\n")
        for root, dirs, _ in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            level = root.replace(root_dir, "").count(os.sep)
            indent = "  " * level
            out.write(f"{indent}{os.path.basename(root) if root != root_dir else root_dir}/\n")
            for d in sorted(dirs):
                out.write(f"{indent}  {d}/\n")

        out.write("\n\nCONTEÚDO DOS ARQUIVOS\n\n")

        total = len(files)
        for i, file_path in enumerate(files, 1):
            rel_path = os.path.relpath(file_path, start=root_dir)
            print(f"📝 Processando {i}/{total}: {rel_path}")
            out.write(f"---\n\nARQUIVO: {rel_path}\n\n")
            ext = os.path.splitext(file_path)[1].lstrip(".")
            out.write(f"```{ext}\n")
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    out.write(content)
                    if not content.endswith("\n"):
                        out.write("\n")
            except Exception as e:
                out.write(f"[ERRO AO LER O ARQUIVO: {e}]\n")
            out.write("```\n\n")

    print(f"\n✅ Arquivo gerado com sucesso: {output_file}")

if __name__ == "__main__":
    main()
