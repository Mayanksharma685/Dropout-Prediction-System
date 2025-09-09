export default function AIAssistant() {
  return (
    <>
      <button id="ai-fab" class="fixed bottom-4 right-4 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 3c-4.97 0-9 3.582-9 8 0 2.52 1.35 4.77 3.47 6.21-.08.66-.33 1.91-1.27 3.31 0 0 1.64-.21 3.44-1.46.98.27 2.03.42 3.36.42 4.97 0 9-3.58 9-8s-4.03-8-9-8z"/></svg>
        <span class="text-sm font-medium">Ask AI</span>
      </button>
      <div id="ai-panel" class="hidden fixed bottom-20 right-4 z-40 w-96 max-w-[95vw] bg-white border rounded-xl shadow-xl">
        <div class="p-3 border-b flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800">AI Assistant</h3>
          <button id="ai-close" class="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div class="p-3 space-y-3">
          <div class="text-xs text-slate-500">Ask about students, risks, attendance, or fees. Answers are grounded in your data.</div>
          <div id="ai-messages" class="h-72 overflow-y-auto space-y-2 pr-1">
            {/* messages appear here */}
          </div>
          <form id="ai-form" class="flex gap-2">
            <input id="ai-input" class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring w-full" placeholder="e.g., Show recent high-risk students" />
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm">Send</button>
          </form>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          function init(){
            var fab = document.getElementById('ai-fab');
            var panel = document.getElementById('ai-panel');
            var closeBtn = document.getElementById('ai-close');
            var form = document.getElementById('ai-form');
            var input = document.getElementById('ai-input');
            var messagesEl = document.getElementById('ai-messages');
            if (!fab || !panel) return;
            function openPanel(){ panel.classList.remove('hidden'); }
            function closePanel(){ panel.classList.add('hidden'); }
            fab.addEventListener('click', openPanel);
            if (closeBtn) closeBtn.addEventListener('click', closePanel);
            var messages = [];
            function renderMessages(){
              if (!messagesEl) return;
              messagesEl.innerHTML = '';
              for (var i=0;i<messages.length;i++){
                var m = messages[i];
                var wrap = document.createElement('div');
                wrap.className = 'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start');
                var bubble = document.createElement('div');
                bubble.className = (m.role === 'user')
                  ? 'max-w-[85%] bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg rounded-br-none shadow'
                  : 'max-w-[85%] bg-slate-100 text-slate-900 text-sm px-3 py-2 rounded-lg rounded-bl-none shadow';
                bubble.textContent = m.content;
                wrap.appendChild(bubble);
                messagesEl.appendChild(wrap);
              }
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
            if (form) form.addEventListener('submit', async function(e){
              e.preventDefault();
              var q = (input && 'value' in input) ? String(input.value).trim() : '';
              if (!q) return;
              // push user message
              messages.push({ role: 'user', content: q });
              if (input) input.value = '';
              renderMessages();
              // placeholder assistant typing with animated dots
              var thinkingIndex = messages.push({ role: 'assistant', content: 'Thinking' }) - 1;
              var submitBtn = form.querySelector('button[type="submit"]');
              if (input) input.disabled = true;
              if (submitBtn) submitBtn.disabled = true;
              var dotCount = 0;
              var dotsTimer = setInterval(function(){
                dotCount = (dotCount + 1) % 4;
                var dots = new Array(dotCount + 1).join('.');
                messages[thinkingIndex].content = 'Thinking' + dots;
                renderMessages();
              }, 400);
              try {
                var res = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q }) });
                var data = await res.json();
                if (!res.ok) {
                  clearInterval(dotsTimer);
                  messages[thinkingIndex] = { role: 'assistant', content: (data && (data.error || data.details)) || 'Request failed.' };
                  renderMessages();
                  if (input) input.disabled = false;
                  if (submitBtn) submitBtn.disabled = false;
                  return;
                }
                clearInterval(dotsTimer);
                messages[thinkingIndex] = { role: 'assistant', content: data.answer || 'No answer.' };
                renderMessages();
              } catch (err) {
                clearInterval(dotsTimer);
                messages[thinkingIndex] = { role: 'assistant', content: String(err) };
                renderMessages();
              } finally {
                if (input) input.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
              }
            });
          }
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
          else init();
        })();
      ` }} />
    </>
  )
}


