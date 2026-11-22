# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seed.spec.js >> LaundrySIA application is reachable
- Location: tests\seed.spec.js:4:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e2]:
  - region "LaundrySIA" [ref=e3]:
    - paragraph [ref=e4]: LaundrySIA
    - heading "LaundrySIA" [level=1] [ref=e5]
    - paragraph [ref=e6]: Masuk untuk mulai mencatat pesanan dan pembayaran.
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Username
        - textbox "Username" [active] [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]: Kata sandi
        - generic [ref=e13]:
          - textbox "Kata sandi" [ref=e14]
          - button "Tampilkan kata sandi" [ref=e15] [cursor=pointer]
      - button "Masuk" [ref=e19] [cursor=pointer]
```