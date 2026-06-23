# Forminc — instrumento harmônico

Instrumento web para tocar campos harmônicos, acordes e camadas sustentadas pelo teclado.

O interruptor no topo alterna entre os temas Escuro e Claro. A preferência fica
salva no navegador.

## Executar

Use o Vite pelo Yarn para carregar os módulos corretamente:

```bash
yarn dev
```

Para gerar a versão de produção:

```bash
yarn build
```

## Controles padrão

- Tônicas: `1` a `0`, `-`, `=`
- Graus: `Q` a `P`, `[`, `]`
- Oitava: `Z` / `X`
- Sustentar enquanto pressionado: `Espaço`
- Toque curto com cauda natural: `Enter`
- Bend de dois semitons: `Shift`

O seletor no topo alterna entre os pianos Grand Concert e Felt. O motor usa
martelo, múltiplas cordas levemente desafinadas, ressonância de caixa, pedal
virtual e reverberação de sala. Os violões foram removidos temporariamente.

## Ritmos

O instrumento inclui levadas Pop, Rock, Vaneirão, Samba, Bossa Nova e Baião:

- `Espaço`: inicia ou para a variação A
- `Enter`: alterna entre as variações A e B
- O andamento pode ser ajustado entre 50 e 220 BPM
- O modo `Manual` preserva as duas batidas livres

Os ritmos ficam separados em `rhythm-presets.js`. O formato é baseado em passos e
foi pensado para receber pacotes adicionais. Uma etapa futura pode ampliar o mesmo
manifesto para referenciar amostras de áudio capturadas de outros instrumentos.

Todos os controles podem ser remapeados pelo botão de configuração no topo.

Tônicas e graus funcionam por seleção: uma tecla escolhe a tônica e cada tecla
de grau ativa ou desativa o intervalo. Isso permite usar quatro graus além da
tônica mesmo em teclados com rollover limitado.

## Memórias harmônicas

Há 24 slots persistentes para conjuntos de até quatro graus. Monte a forma,
pressione `SALVAR` no slot desejado e depois use a tecla indicada para chamá-la.
Ao salvar, você pode dar um nome ao conjunto; o ícone de lápis permite renomeá-lo
depois sem alterar seus graus. As teclas dos slots também podem ser remapeadas.

Opcionalmente, cada tônica pode apontar para uma memória na área “Formas
automáticas”. Ao selecionar essa tônica, a forma escolhida é carregada. A memória
continua neutra e pode ser usada por várias tônicas. Uma memória chamada
manualmente depois sempre substitui a forma automática.

## Tônicas inteligentes

O modo opcional “Tônicas inteligentes” troca as 12 notas cromáticas pelas sete
posições do campo harmônico. As memórias passam a ser vinculadas aos botões
I–VII, não às notas; por isso acompanham a mudança de tonalidade.

No padrão “Por nome da nota”:

- `C D E F G A B`: escolhem a nota correspondente dentro do campo atual
- `Shift+C` até `Shift+B`: mudam a tonalidade
- `←` / `→`: alternam bemol ou sustenido
- `↑` / `↓`: escolhem maior ou menor

No mapeador também é possível selecionar o padrão clássico “Por posição”, em
que `1–7` escolhem I–VII e `C–B` mudam a tonalidade. Esses comandos inteligentes
são fixos e não podem ser remapeados individualmente.

## Campo de apresentação

O seletor Compositor/Apresentação separa os comandos dos dois contextos.

No compositor, monte a harmonia normalmente e use o botão `+` da tônica para
enviá-la automaticamente ao próximo espaço livre da apresentação. Existem 20
espaços. Cada slot preserva:

- tônica e sua grafia;
- memória/forma harmônica e graus exatos;
- oitava.

O nome é criado pela tônica e pela memória, como `C#Dominante9`. O ritmo não é
salvo: ele continua livre para escolha e execução durante a apresentação.
As 20 teclas podem ser alteradas nas configurações. Quando esse campo está
ativo, os atalhos do compositor ficam suspensos; Espaço, Enter e Shift continuam
controlando ritmo, variação e efeito.

O botão `+` pergunta se a captura será uma nota comum ou uma das 10 notas base,
desde que exista espaço livre. Uma base permanece sustentada enquanto outras
notas são tocadas. Chamar outra base substitui a atual; chamar a mesma novamente
a desliga. As 10 teclas de base também são configuráveis.

### Conjuntos

No Campo de Apresentação, as 20 notas e 10 bases podem ser salvas juntas como
um conjunto — equivalente a uma música ou preparação de palco. O gerenciador
permite criar, carregar, atualizar e excluir conjuntos. O ritmo não faz parte do
conjunto e permanece livre durante a execução.

Os cartões podem ser reordenados com arrastar e soltar; essa ordem representa a
sequência do show. No Campo de Apresentação, `←` carrega o conjunto anterior e
`→` carrega o próximo. Os botões inteligentes no gerenciador fazem a mesma
navegação e mostram a posição atual no repertório.

Os atalhos configuráveis aceitam combinações com modificadores, como `Shift+1`,
`Ctrl+Q` ou `Alt+F2`. No remapeador, segure o modificador e pressione a tecla
principal. A combinação aparece em uma área de pré-visualização e só é gravada
ao pressionar `Confirmar`. Pressionar e soltar apenas o modificador permite
confirmá-lo como comando simples, como o `Shift` usado pelo bend.

Além dos graus naturais, a paleta inclui versões bemóis e sustenidas. Assim,
por exemplo, `C7` usa `C + ♭7`, enquanto `Cmaj7` usa `C + 7`.
