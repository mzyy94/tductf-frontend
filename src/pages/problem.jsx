import React from 'react';
import Router from 'react-router';
import Api from '../api/api'
import {connect} from 'react-redux';
import {UPDATE_A_PROBLEM, EE} from '../data/store'
global.React = React;
var md2react = require('md2react');
var Link = Router.Link;

class Problem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			flagText: "",
			pending: false,
			failed: false,
			correct: false,
			error: null,
			answerCount: 0
		};
	}
	componentWillMount() {
		// Tap tap API server
		Api.problem(this.props.params.id, (json) => {
			this.props.updateAProblem(json);
		}, (mes) => {
			this.setState({
				error: mes
			});
		})
	}
	changeText(e) {
		var value = {}
		value[e.target.name] = e.target.value;
		this.setState(value);
	}
	submitFlag() {
		this.setState({
			pending: true,
			failed: false
		});

		console.log(this.state.flagText);
		Api.submitFlag(this.props.params.id, this.state.flagText, () => {
			this.setState({
				correct: true
			});
			React.render(<div><div className="header">Congratulations</div><p>{this.state.flagText} is correct!!</p></div>, document.querySelector('.ui.success.message'));
		}, (mes) => {
			this.setState({
				pending: false,
				failed: true,
				answerCount: this.state.answerCount + 1
			});
			React.render(<div><div className="header">Failed</div><p>{mes[0]}</p></div>, document.querySelector('.ui.error.message'));
			if (this.state.answerCount > 5) {
				this.props.tooManyWrongAnswer();
				this.state.answerCount = 0;
			}
		})
		return false;
	}
	clearError() {
		this.setState({
			error: null
		});
	}
	render() {
		const {teaminfo, problems} = this.props;
		var problem = problems[this.props.params.id];
		if (!problem) return (<div>Cannot find a problem.</div>);
		var problem_status = {};
		if (teaminfo && teaminfo.questions) {
			teaminfo.questions.forEach((t_state) => {
				if (problem.id == t_state.id) {
					problem_status = t_state;
				}
			}.bind(this))
		}
		var progress = Math.round(~~problem_status.points / problem["points"] * 100);
		var progressStyle = {
			width: progress + "%"
		};
		var attachments = problem["files"].map((file) => {
			var button = (
					<div className="ui buttons">
						<a className="ui labeled icon button" key={file["url"]} href={file["url"]} target="_blank">
							<i className="file archive outline icon"></i>
							{file["name"]}
						</a>
					</div>
					);
			return (
				<div>
					{button}
					<div className="ui pointing left label">{file["size"]} bytes</div>
				</div>
				   );
		}.bind(this));
		var errorMessage;
		if (this.state.error) {
			errorMessage = (
					<div className="ui floating negative message">
						<i className="close icon" onClick={this.clearError.bind(this)}></i>
							<div className="header">
								Error
							</div>
						<p>{this.state.error[0]}</p>
					</div>
					);
		}
		return (
				<div className="ui container">
					<div className="ui breadcrumb">
						<Link className="section" to="problems">Problems</Link>
						<i className="right angle icon divider"></i>
						<span className="active section">{problem["title"]}</span>
					</div>
					<div className="ui items">
						<div className="item">
							<div className="content">
								<a className="header">{problem["title"]}</a>
								<div className="meta">
									<span>{problem["points"]} points</span>
								</div>
								<div className="description">
											<div className="ui raised segment">
												<span className="ui top left attached label">{problem["category"]["name"]}</span>
												{md2react(problem["sentence"], {gfm: true, tables: true})}
											</div>
								</div>
								<div className="extra">
								{attachments}
								</div>
							</div>
						</div>
					</div>
					<form className={'ui form' + (this.state.failed ? ' error' : (this.state.correct ? ' success' : ''))} onSubmit={this.submitFlag.bind(this)}>
						<div className="ui indicating progress active" data-percent="0">
							<div className="bar" style={progressStyle} ></div>
							<div className="label">You got {~~problem_status.points} points of {problem["points"]} points</div>
						</div>
						<div className="ui right action left icon input">
							<i className="flag icon"></i>
							<input type="text" placeholder="Enter the flag" name="flagText" onChange={this.changeText.bind(this)} value={this.state.flagText} />
							<div className="ui primary button" onClick={this.submitFlag.bind(this)}>Submit</div>
						</div>
						<div className="ui error message"></div>
						<div className="ui success message"></div>
					</form>
					<div className="ui divider">
					</div>
					{errorMessage}
				</div>
			   );
	}
};

export default connect(
		(state) => ({
			teaminfo: state.teamInfo,
			problems: state.problems
		}),
		(dispatch) => ({
			updateAProblem: (data) => dispatch({type: UPDATE_A_PROBLEM, data: data}),
			tooManyWrongAnswer: () => dispatch({type: EE, data: true}),
		})
		)(Problem);
