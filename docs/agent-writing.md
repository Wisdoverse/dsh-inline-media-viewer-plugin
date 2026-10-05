# Writing rules for agents

Apply these rules to English text that you write or change.
For Chinese text, use short sentences with explicit actions and consistent terms.
The English word limits do not apply to Chinese text.

These project rules strictly apply the structural principles of ASD-STE100.
They do not establish compliance with the official dictionary.

## Sentences

- Give one instruction per sentence.
- Limit each instruction to 20 words.
- Limit each description to 25 words.
- Use active voice with a clear actor.
- Use the imperative for instructions.
- Put a condition before the action that depends on it.
- Use simple present, past, or future tenses.
- Preserve a compound tense when a simpler tense changes the meaning.
- Name any necessary departure from these rules.
- Use one plain verb for an action.
- Do not use phrasal verbs, semicolons, or contractions.
- Keep articles and necessary sentence parts.
- Use the specific noun when a pronoun can refer to several things.
- Limit a noun group to three words.

## Terms and structure

- Use one term for one meaning.
- Define a new technical term at its first use.
- Keep identifiers, commands, paths, and quoted output exact.
- Give each paragraph one topic.
- Limit each paragraph to six sentences.
- Use numbered steps when order matters.
- Use a list for three or more steps or conditions.
- Delete claims about quality that lack evidence.
- Preserve facts, uncertainty, conditions, limits, and units.

## Project terms

| Term | Meaning |
| --- | --- |
| host | The DSH process that serves the plugin API. |
| client | The plugin code that runs in the browser. |
| session workspace | The directory from the DSH session record. |
| ComfyUI origin | The scheme, host, and port for the ComfyUI proxy target. |
| check | An action that compares a result with an expected result. |

## Reports

- Reply in the user's language.
- State the result first.
- Report the changed behavior, completed checks, and remaining limits.
- Report missing dependencies and skipped checks.
- Name the DSH version when you report a UI check.
- Do not infer browser behavior from syntax checks or mocked tests.

## References

- [Karpathy's post](https://x.com/karpathy/status/2105819303471976479) is the user-supplied reference.
- [ASD-STE100 overview](https://www.asd-ste100.org/about_STE.html) describes the writing rules and dictionary.
- [ASD-STE100 downloads](https://www.asd-ste100.org/STE_downloads.html) provides the official standard.

Check sentence structure and project facts before you finish a text change.
If the ASD-STE100 skill is available, run its `ste-lint.py` script on the changed documents.
The script does not check the official dictionary or all grammar rules.
