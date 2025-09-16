# Contributing to Face Age & Gender Recognition

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs or request features
- Provide detailed information about the issue, including:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/device information
  - Screenshots if applicable

### Suggesting Enhancements
- Open an issue with the "enhancement" label
- Describe the proposed feature in detail
- Explain the benefits and use cases
- Consider implementation complexity

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure code follows project standards
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📋 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent indentation (2 spaces)
- Use ESLint configuration provided

### Component Structure
- Keep components focused and single-purpose
- Use TypeScript interfaces for props and state
- Implement proper error handling
- Follow React hooks best practices

### Performance Considerations
- Optimize face detection performance
- Minimize re-renders
- Use proper dependency arrays in useEffect
- Consider memory usage with large models

### Testing
- Test on multiple browsers and devices
- Verify camera functionality
- Test liveness detection accuracy
- Check responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Git
- Modern web browser
- Camera access for testing

### Setup
1. Clone your fork: `git clone https://github.com/YOUR_USERNAME/project-age.git`
2. Install dependencies: `npm install`
3. Download AI models to `public/models/`
4. Start development server: `npm run dev`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎯 Areas for Contribution

### High Priority
- **Performance Optimization**: Improve face detection speed
- **Accessibility**: Enhance screen reader support
- **Mobile Experience**: Improve mobile camera handling
- **Error Handling**: Better error messages and recovery

### Medium Priority
- **UI/UX Improvements**: Better visual design and animations
- **Configuration**: More customizable detection parameters
- **Documentation**: Improve code comments and examples
- **Testing**: Add unit and integration tests

### Low Priority
- **Additional Features**: New detection capabilities
- **Internationalization**: Multi-language support
- **Themes**: Dark/light mode support
- **Analytics**: Usage tracking and metrics

## 📝 Pull Request Guidelines

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation updated if needed
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers
- [ ] Performance impact considered

### PR Description
- Clear title describing the change
- Detailed description of what was changed
- Reference any related issues
- Include screenshots for UI changes
- List any breaking changes

### Review Process
- All PRs require review before merging
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Be responsive to reviewer comments

## 🐛 Bug Reports

When reporting bugs, please include:

### Environment Information
- Operating System and version
- Browser name and version
- Node.js version
- Device type (desktop/mobile)

### Reproduction Steps
1. Clear, numbered steps to reproduce
2. Expected behavior
3. Actual behavior
4. Any error messages

### Additional Information
- Screenshots or screen recordings
- Browser console errors
- Network tab information (if relevant)
- Any workarounds found

## 💡 Feature Requests

When suggesting features:

### Problem Description
- What problem does this solve?
- Who would benefit from this feature?
- Is this a common use case?

### Proposed Solution
- Detailed description of the feature
- How it would work
- Any alternatives considered

### Implementation Considerations
- Technical complexity
- Performance impact
- Backward compatibility
- Maintenance requirements

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Community
- GitHub Discussions for questions
- Issues for bug reports and feature requests
- Pull Requests for code contributions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor statistics

Thank you for contributing to make this project better! 🚀
