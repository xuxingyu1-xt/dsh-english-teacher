window.__ModuleLoader__.load({
	id: "dsh-english-teacher",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		const h = React.createElement;

		/** Panel id; the sidebar entry and the `main` slot are addressed by it. */
		const PANEL_ID = "english-teacher";
		/** Private Host RPC channel (never the shared `/api`). */
		const CHANNEL = "/dsh-english-teacher";
		const NS = "dsh-english-teacher";
		const STYLE_ID = "dsh-english-teacher-style";
		/** Settings namespace: the profile row id that carries this plugin's own config. */
		const FORM_NS = "english-teacher-panel";
		/** Config fields the settings tab edits; every one is volatile in the Host schema. */
		const SETTINGS_FIELDS = ["provider", "model", "maxTokens", "temperature", "extraInstruction"];
		/** One spec per editable field, built with the shared settings field factories. */
		const SETTINGS_SPECS = [
			primitives.settingsTextField("provider"),
			primitives.settingsTextField("model"),
			primitives.settingsNumberField("maxTokens"),
			primitives.settingsNumberField("temperature"),
			primitives.settingsTextField("extraInstruction"),
		];

		/**
		 * Panel state lives outside React on purpose. The component unmounts on every
		 * sidebar switch, and an analysis still in flight must land anyway: a state
		 * updater on an unmounted component never runs, so it cannot be the write path.
		 * The request writes this store directly, whichever instance is mounted reads
		 * it, and localStorage mirrors it so a page reload keeps it too.
		 */
		const PANEL_STATE_KEY = "dsh-english-teacher:panel";
		const EMPTY_PANEL = { text: "", result: null, error: "", busy: false };
		function loadPanelState() {
			try {
				const raw = globalThis.localStorage?.getItem(PANEL_STATE_KEY);
				if (!raw) return { ...EMPTY_PANEL };
				const parsed = JSON.parse(raw);
				return {
					text: typeof parsed?.text === "string" ? parsed.text : "",
					result: parsed?.result ?? null,
					error: typeof parsed?.error === "string" ? parsed.error : "",
					busy: false,
				};
			} catch {
				return { ...EMPTY_PANEL };
			}
		}
		/** `busy` is deliberately not persisted: a reload cannot still be in flight. */
		function savePanelState(state) {
			try {
				globalThis.localStorage?.setItem(
					PANEL_STATE_KEY,
					JSON.stringify({ text: state.text, result: state.result, error: state.error }),
				);
			} catch {
				/* Storage is best-effort; the in-memory store still holds. */
			}
		}
		const panelStore = {
			state: loadPanelState(),
			listeners: new Set(),
			get() {
				return panelStore.state;
			},
			set(patch) {
				panelStore.state = { ...panelStore.state, ...patch };
				savePanelState(panelStore.state);
				for (const listener of [...panelStore.listeners]) listener();
			},
			subscribe(listener) {
				panelStore.listeners.add(listener);
				return () => panelStore.listeners.delete(listener);
			},
		};
		/** Read the store and re-render whenever a mounted instance or the request writes it. */
		function usePanelStore() {
			const [state, setState] = React.useState(() => panelStore.get());
			React.useEffect(() => panelStore.subscribe(() => setState(panelStore.get())), []);
			return state;
		}

		const zh = {
			panel: "英语老师",
			title: "英语老师",
			hint: "输入中文或英文，回车前按 ⌘/Ctrl+Enter 也可以分析。中文会被翻成英文，英文会先检查语法。",
			placeholder: "在这里粘贴你想检查的英文，或想翻成英文的中文……",
			analyze: "分析",
			analyzing: "分析中…",
			clear: "清空",
			copy: "复制",
			copied: "已复制",
			grammar: "语法与对比",
			corrected: "修改版",
			common: "通用版",
			professional: "专业版",
			empty: "还没有结果",
			emptyHint: "在下面输入内容后点「分析」。",
			failed: "分析失败",
			by: "由",
			settingsTab: "英语老师",
			settingsTitle: "英语老师 · 后端模型",
			settingsHint: "决定「分析」用哪个模型。provider 填已注册的路由名（如 bailian，或本机的 hy-mt），模型名填该路由下的 id。",
			provider: "Provider",
			model: "模型",
			maxTokens: "最大输出 token",
			temperature: "温度",
			extraInstruction: "附加指令",
			extraHint: "追加到提示词末尾，可写风格偏好；留空即不用",
			save: "保存",
			saving: "保存中…",
			discard: "放弃修改",
			unsaved: "有未保存的修改",
			notWritable: "当前作用域不可写",
			saveFailed: "保存失败",
			catalogHint: "可选 provider 共",
			catalogLoading: "正在读取 provider 列表…",
			discovering: "正在向该路由发现可用模型…",
			modelsFound: "个可用模型",
			noModels: "该路由未报告模型清单，直接填模型 id 即可",
			modelHint: "选择 provider 后自动列出可用模型",
			modelPlaceholder: "或直接输入模型 id",
			customOption: "自定义…",
		};
		const en = {
			panel: "English Teacher",
			title: "English Teacher",
			hint: "Paste Chinese or English. Cmd/Ctrl+Enter also runs it. Chinese gets translated, English gets checked first.",
			placeholder: "Paste the English you want checked, or the Chinese you want in English…",
			analyze: "Analyze",
			analyzing: "Analyzing…",
			clear: "Clear",
			copy: "Copy",
			copied: "Copied",
			grammar: "Grammar & comparison",
			corrected: "Corrected",
			common: "Common",
			professional: "Professional",
			empty: "No result yet",
			emptyHint: "Type something below, then press Analyze.",
			failed: "Analysis failed",
			by: "by",
			settingsTab: "English Teacher",
			settingsTitle: "English Teacher · backend model",
			settingsHint: "Which model answers. Use a registered provider route (bailian, or the local hy-mt) plus a model id under it.",
			provider: "Provider",
			model: "Model",
			maxTokens: "Max output tokens",
			temperature: "Temperature",
			extraInstruction: "Extra instruction",
			extraHint: "Appended to the prompt; leave empty to skip",
			save: "Save",
			saving: "Saving…",
			discard: "Discard",
			unsaved: "Unsaved changes",
			notWritable: "Not writable in this scope",
			saveFailed: "Save failed",
			catalogHint: "Providers available:",
			catalogLoading: "Loading providers…",
			discovering: "Discovering models on this route…",
			modelsFound: "models available",
			noModels: "This route reports no model list — type the model id",
			modelHint: "Pick a provider to list its models",
			modelPlaceholder: "or type a model id",
			customOption: "Custom…",
		};

		const CSS = `
.dsh-et-root { display:flex; flex-direction:column; gap:16px; height:100%; box-sizing:border-box;
  padding:calc(var(--dsh-frame-top-clearance, 0px) + 20px) 24px 24px; overflow:auto; }
.dsh-et-head { display:flex; align-items:baseline; gap:12px; }
.dsh-et-head h2 { margin:0; font-size:16px; }
.dsh-et-hint { color:var(--dsh-color-text-tertiary, #8a8a8a); font-size:12px; }
.dsh-et-input textarea { width:100%; min-height:120px; resize:vertical; box-sizing:border-box; padding:12px;
  border-radius:8px; font:inherit; font-size:14px; line-height:1.5;
  border:1px solid var(--dsh-color-border, #d9d9d9); background:var(--dsh-color-bg, transparent);
  color:inherit; }
.dsh-et-input textarea:focus { outline:none; border-color:var(--dsh-color-primary, #4b6bfb); }
.dsh-et-actions { display:flex; align-items:center; gap:12px; margin-top:10px; }
.dsh-et-actions button { padding:7px 18px; border-radius:6px; border:1px solid transparent; cursor:pointer;
  font:inherit; font-size:13px; background:var(--dsh-color-primary, #4b6bfb); color:#fff; }
.dsh-et-actions button.secondary { background:transparent; color:inherit;
  border-color:var(--dsh-color-border, #d9d9d9); }
.dsh-et-actions button:disabled { opacity:.55; cursor:default; }
.dsh-et-meta { color:var(--dsh-color-text-tertiary, #8a8a8a); font-size:12px; }
.dsh-et-error { color:var(--dsh-color-danger, #d4380d); font-size:13px; white-space:pre-wrap; }
.dsh-et-cols { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px; }
@media (max-width: 1100px) { .dsh-et-cols { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
.dsh-et-col { display:flex; flex-direction:column; min-width:0; border-radius:8px;
  border:1px solid var(--dsh-color-border, #d9d9d9); overflow:hidden; }
.dsh-et-col > header { display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:8px 12px; border-bottom:1px solid var(--dsh-color-border, #d9d9d9); }
.dsh-et-col h3 { margin:0; font-size:12px; font-weight:600; letter-spacing:.02em; }
.dsh-et-col header button { border:none; background:transparent; cursor:pointer; font:inherit;
  font-size:11px; color:var(--dsh-color-text-tertiary, #8a8a8a); padding:2px 4px; }
.dsh-et-body { padding:12px; font-size:13px; line-height:1.6; white-space:pre-wrap; word-break:break-word;
  flex:1; overflow:auto; min-height:120px; }
.dsh-et-body.empty { color:var(--dsh-color-text-tertiary, #8a8a8a); font-style:italic; }
.dsh-et-empty { display:flex; flex-direction:column; gap:6px; padding:28px 0; text-align:center;
  color:var(--dsh-color-text-tertiary, #8a8a8a); font-size:13px; }
.dsh-et-empty strong { color:inherit; font-weight:600; }
.dsh-et-settings { max-width:720px; padding:calc(var(--dsh-frame-top-clearance, 0px) + 20px) 4px 24px; }
.dsh-et-settings h2 { margin:0 0 6px; font-size:16px; }
.dsh-et-settings > .dsh-et-hint { display:block; margin:0 0 18px; }
.dsh-et-row { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
.dsh-et-row-label { font-size:12px; font-weight:600; }
.dsh-et-row-hint { font-size:11px; color:var(--dsh-color-text-tertiary, #8a8a8a); word-break:break-all; }
.dsh-et-row input, .dsh-et-row select { padding:7px 10px; border-radius:6px; font:inherit; font-size:13px;
  border:1px solid var(--dsh-color-border, #d9d9d9); background:var(--dsh-color-bg, transparent); color:inherit; }
.dsh-et-row select { cursor:pointer; }
.dsh-et-row input:focus, .dsh-et-row select:focus { outline:none; border-color:var(--dsh-color-primary, #4b6bfb); }
`;

		function ensureStyles() {
			if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.textContent = CSS;
			document.head.appendChild(style);
		}

		/** One result column, with its own copy button. */
		function Column({ title, body, copyLabel, copiedLabel }) {
			const [copied, setCopied] = React.useState(false);
			const copy = React.useCallback(() => {
				if (!body) return;
				void navigator.clipboard?.writeText(body).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1200);
				});
			}, [body]);
			return h(
				"section",
				{ className: "dsh-et-col" },
				h(
					"header",
					null,
					h("h3", null, title),
					h("button", { type: "button", onClick: copy, disabled: !body }, copied ? copiedLabel : copyLabel),
				),
				h("div", { className: body ? "dsh-et-body" : "dsh-et-body empty" }, body || "—"),
			);
		}

		/** The panel body: input on top, four columns below. */
		function EnglishTeacherPanel(props) {
			const t = props.t;
			const rpc = props.rpc;
			const { text, result, error, busy } = usePanelStore();

			const run = React.useCallback(async () => {
				const current = panelStore.get();
				const input = current.text.trim();
				if (!input || current.busy) return;
				panelStore.set({ busy: true, error: "" });
				try {
					const envelope = await rpc.call(CHANNEL, "analyze", { text: input });
					if (!envelope || envelope.ok !== true) {
						panelStore.set({ error: envelope?.error?.message || t("failed"), result: null });
					} else {
						panelStore.set({ result: envelope.value, error: "" });
					}
				} catch (cause) {
					panelStore.set({ error: cause instanceof Error ? cause.message : String(cause), result: null });
				} finally {
					// Cleared here, not in the component: the panel may be unmounted by now.
					panelStore.set({ busy: false });
				}
			}, [rpc, t]);

			const onKeyDown = React.useCallback(
				(event) => {
					if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
						event.preventDefault();
						void run();
					}
				},
				[run],
			);

			const meta = result
				? `${t("by")} ${result.provider}/${result.model}${result.elapsedMs ? ` · ${(result.elapsedMs / 1000).toFixed(1)}s` : ""}`
				: "";

			return h(
				"div",
				{ className: "dsh-et-root" },
				h(
					"div",
					{ className: "dsh-et-head" },
					h("h2", null, t("title")),
					h("span", { className: "dsh-et-hint" }, t("hint")),
				),
				h(
					"div",
					{ className: "dsh-et-input" },
					h("textarea", {
						value: text,
						placeholder: t("placeholder"),
						onChange: (event) => panelStore.set({ text: event.target.value }),
						onKeyDown,
					}),
					h(
						"div",
						{ className: "dsh-et-actions" },
						h("button", { type: "button", onClick: () => void run(), disabled: busy || !text.trim() }, busy ? t("analyzing") : t("analyze")),
						h("button", { type: "button", className: "secondary", onClick: () => panelStore.set({ text: "", result: null, error: "" }), disabled: busy || (!text && !result) }, t("clear")),
						h("span", { className: "dsh-et-meta" }, meta),
					),
					error ? h("div", { className: "dsh-et-error" }, `${t("failed")}: ${error}`) : null,
				),
				result
					? h(
							"div",
							{ className: "dsh-et-cols" },
							h(Column, { title: t("grammar"), body: result.grammar, copyLabel: t("copy"), copiedLabel: t("copied") }),
							h(Column, { title: t("corrected"), body: result.corrected, copyLabel: t("copy"), copiedLabel: t("copied") }),
							h(Column, { title: t("common"), body: result.common, copyLabel: t("copy"), copiedLabel: t("copied") }),
							h(Column, { title: t("professional"), body: result.professional, copyLabel: t("copy"), copiedLabel: t("copied") }),
						)
					: h(
							"div",
							{ className: "dsh-et-empty" },
							h("strong", null, t("empty")),
							h("span", null, t("emptyHint")),
						),
			);
		}

		/** Sentinel option that switches a free field to typing. */
		const CUSTOM_OPTION = "\u0000custom";

		/** A native select; `onCustom` adds a trailing escape hatch to the list. */
		function SettingsSelect({ value, options, onChange, onCustom, customLabel }) {
			const list = value && !options.includes(value) ? [value, ...options] : options;
			return h(
				"select",
				{
					className: "dsh-et-select",
					value,
					onChange: (event) => (event.target.value === CUSTOM_OPTION ? onCustom() : onChange(event.target.value)),
				},
				list.map((option) => h("option", { key: option, value: option }, option)),
				onCustom ? h("option", { key: CUSTOM_OPTION, value: CUSTOM_OPTION }, customLabel) : null,
			);
		}

		/**
		 * One labelled control in the settings tab.
		 *
		 * A field with options is a select; a free field falls back to typing when the
		 * current value is not in the list, because an enumerated list is never
		 * guaranteed to be complete.
		 */
		function SettingsRow({ label, kind, value, onChange, hint, options, free, placeholder, customLabel }) {
			const [typing, setTyping] = React.useState(false);
			const hasOptions = Boolean(options && options.length);
			const inList = hasOptions && options.includes(value);
			const typingNow = !hasOptions || typing || (free && !inList);
			return h(
				"label",
				{ className: "dsh-et-row" },
				h("span", { className: "dsh-et-row-label" }, label),
				typingNow
					? h("input", {
							type: kind === "number" ? "number" : "text",
							value,
							placeholder,
							onChange: (event) => onChange(event.target.value),
						})
					: h(SettingsSelect, {
							value,
							options,
							onChange,
							customLabel,
							onCustom: free ? () => setTyping(true) : undefined,
						}),
				hint ? h("span", { className: "dsh-et-row-hint" }, hint) : null,
			);
		}

		/**
		 * The settings tab: which backend model answers, and how.
		 *
		 * Edits are staged in the shared form model and written by its save; the
		 * provider catalog comes over the same private channel the panel uses.
		 */
		/**
		 * Provider/model catalog, cached outside React because the settings page
		 * remounts on every visit: a fresh mount would otherwise show a text input
		 * until discovery answers again.
		 */
		const catalogCache = { providers: [], models: {}, notes: {} };

		function EnglishTeacherSettings(props) {
			const t = props.t;
			const form = props.form;
			const rpc = props.rpc;
			const remote = props.remote;
			const read = () => Object.fromEntries(SETTINGS_FIELDS.map((field) => [field, form.field(field).text]));
			const [draft, setDraft] = React.useState(read);
			const [, setTick] = React.useState(0);
			const [providers, setProviders] = React.useState(catalogCache.providers);
			const [modelIds, setModelIds] = React.useState(catalogCache.models[read().provider] || []);
			const [modelNote, setModelNote] = React.useState(catalogCache.notes[read().provider] || "");
			const [error, setError] = React.useState("");

			React.useEffect(() => {
				if (catalogCache.providers.length) {
					setProviders(catalogCache.providers);
					return undefined;
				}
				let alive = true;
				void rpc
					.call(CHANNEL, "models", {})
					.then((envelope) => {
						if (!alive || !envelope?.ok) return;
						const list = envelope.value.providers || [];
						catalogCache.providers = list;
						setProviders(list);
					})
					.catch(() => {});
				return () => {
					alive = false;
				};
			}, [rpc]);

			// Ask the model layer which ids this provider route serves, the same way the
			// shipped Models page does; a route that cannot answer keeps a text input.
			React.useEffect(() => {
				const provider = draft.provider;
				if (!provider) return undefined;
				// Configuration first: routes declared in this profile carry their model list
				// there, and the Host reads it for us because pi-ai ships no catalog for them.
				const fromConfig = catalogCache.providers.find((entry) => entry.id === provider)?.models || [];
				if (fromConfig.length) {
					catalogCache.models[provider] = fromConfig;
					catalogCache.notes[provider] = "";
					setModelIds(fromConfig);
					setModelNote("");
					return undefined;
				}
				// Then a previous answer, including an empty one — an empty array is a real
				// answer and must not be re-probed on every render.
				if (catalogCache.models[provider]) {
					setModelIds(catalogCache.models[provider]);
					setModelNote(catalogCache.notes[provider] || "");
					return undefined;
				}
				// The provider catalog has not arrived yet: wait for it rather than probing.
				if (!catalogCache.providers.length) return undefined;
				if (!remote?.llm?.discoverModels) {
					setModelNote(t("noModels"));
					return undefined;
				}
				let alive = true;
				setModelNote(t("discovering"));
				remote.llm
					.discoverModels("llm-pi-ai", { provider })
					.then((response) => {
						if (!alive) return;
						const ids = response?.ok
							? (response.value || [])
									.map((entry) => (typeof entry === "string" ? entry : entry?.id))
									.filter(Boolean)
							: [];
						const note = ids.length ? "" : response?.ok ? t("noModels") : response?.error?.message || t("noModels");
						catalogCache.models[provider] = ids;
						catalogCache.notes[provider] = note;
						setModelIds(ids);
						setModelNote(note);
					})
					.catch(() => {
						if (!alive) return;
						catalogCache.models[provider] = [];
						catalogCache.notes[provider] = t("noModels");
						setModelIds([]);
						setModelNote(t("noModels"));
					});
				return () => {
					alive = false;
				};
			}, [draft.provider, providers, remote, t]);

			const edit = (field, value) => {
				setDraft((current) => ({ ...current, [field]: value }));
				form.actions().edit(field, value);
				setTick((n) => n + 1);
			};
			const shell = form.shell();

			const save = async () => {
				setError("");
				try {
					await form.save();
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
				setDraft(read());
				setTick((n) => n + 1);
			};
			const discard = () => {
				form.actions().discard();
				setDraft(read());
				setTick((n) => n + 1);
			};

			return h(
				"div",
				{ className: "dsh-et-settings" },
				h("h2", null, t("settingsTitle")),
				h("p", { className: "dsh-et-hint" }, t("settingsHint")),
				h(SettingsRow, {
					label: t("provider"),
					value: draft.provider,
					onChange: (value) => edit("provider", value),
					options: providers.map((entry) => entry.id),
					hint: providers.length ? `${t("catalogHint")}: ${providers.length}` : t("catalogLoading"),
				}),
				h(SettingsRow, {
					label: t("model"),
					value: draft.model,
					onChange: (value) => edit("model", value),
					options: modelIds,
					free: true,
					placeholder: t("modelPlaceholder"),
					customLabel: t("customOption"),
					hint: modelNote || (modelIds.length ? `${modelIds.length} ${t("modelsFound")}` : t("modelHint")),
				}),
				h(SettingsRow, {
					label: t("maxTokens"),
					kind: "number",
					value: draft.maxTokens,
					onChange: (value) => edit("maxTokens", value),
				}),
				h(SettingsRow, {
					label: t("temperature"),
					kind: "number",
					value: draft.temperature,
					onChange: (value) => edit("temperature", value),
				}),
				h(SettingsRow, {
					label: t("extraInstruction"),
					value: draft.extraInstruction,
					onChange: (value) => edit("extraInstruction", value),
					hint: t("extraHint"),
				}),
				h(
					"div",
					{ className: "dsh-et-actions" },
					h(
						"button",
						{ type: "button", onClick: () => void save(), disabled: !shell.dirty || shell.saving || !shell.writable },
						shell.saving ? t("saving") : t("save"),
					),
					h("button", { type: "button", className: "secondary", onClick: discard, disabled: !shell.dirty }, t("discard")),
					!shell.writable ? h("span", { className: "dsh-et-meta" }, t("notWritable")) : null,
					shell.dirty ? h("span", { className: "dsh-et-meta" }, t("unsaved")) : null,
					shell.failed || error ? h("span", { className: "dsh-et-error" }, `${t("saveFailed")}: ${error}`) : null,
				),
			);
		}

		/** Sidebar icon: a speech bubble with a pencil, drawn inline so no asset is needed. */
		function EnglishTeacherIcon() {
			return h(
				"svg",
				{ width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
				h("path", { d: "M4 5.5h16v10H9l-5 4v-14z" }),
				h("path", { d: "M12.5 8.5l3.5 3.5-3.5 3.5" }),
			);
		}

		const inject = ["slots", "locale", "connection", "configForms", "remote", "remote.llm"];

		function apply(ctx) {
			ensureStyles();
			ctx.effect(
				() => ctx.locale.register(NS, { zh, en }),
				"dsh-english-teacher: locale dictionaries",
			);
			const t = ctx.locale.bind(NS);

			// Sidebar entry (root-scoped list slot).
			ctx.slots.inject("sidebar.panellist", () =>
				ctx.slots.register(
					{
						name: "sidebar.panellist",
						id: PANEL_ID,
						order: 20,
						label: () => t("panel"),
						locale: NS,
					},
					EnglishTeacherIcon,
				),
			);

			// The page itself: root-scoped `main` keyed slot, keyed by the same id.
			ctx.slots.inject("main", () =>
				ctx.slots.register(
					{
						name: "main",
						key: PANEL_ID,
						locale: NS,
						inject: () => ({ rpc: ctx.connection.rpc, t }),
					},
					(registered) => h(EnglishTeacherPanel, registered),
				),
			);

			// Settings tab: edit this plugin's own config namespace (`english-teacher-panel`).
			ctx.slots.inject("settings.section", () =>
				ctx.slots.register(
					{
						name: "settings.section",
						id: PANEL_ID,
						order: 20,
						label: () => t("settingsTab"),
						inject: () => ({
							form: new primitives.SettingsFormModel(ctx.configForms.get(FORM_NS), SETTINGS_SPECS),
							rpc: ctx.connection.rpc,
							remote: ctx.remote,
							t,
						}),
					},
					(registered) => h(EnglishTeacherSettings, registered),
				),
			);
		}

		exports.name = "dsh-english-teacher";
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
