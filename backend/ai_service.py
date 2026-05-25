import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY", os.getenv("OPENAI_API_KEY")),
    base_url="https://api.groq.com/openai/v1"
)

def analyze_metrics(metrics, errors):
    prompt = f"""
    You are an expert frontend performance engineer. Analyze these frontend metrics and errors:

    Metrics: {metrics}
    Errors: {errors}

    Provide your analysis in this EXACT format using || separators. Do not add any other keys.
    You can use multiple lines or markdown in the values.

    SUMMARY|| <Write a comprehensive summary of the current frontend health>
    SEVERITY|| <CRITICAL/HIGH/MEDIUM/LOW/HEALTHY>
    IMPACT|| <Explain how these metrics affect the end user experience>
    ROOT_CAUSE|| <Identify the primary performance bottlenecks or errors>
    LCP_INSIGHT|| <Detailed analysis of Largest Contentful Paint>
    CLS_INSIGHT|| <Detailed analysis of Cumulative Layout Shift>
    INP_INSIGHT|| <Detailed analysis of Interaction to Next Paint>
    SUGGESTED_FIX|| <Actionable steps to resolve the issues (can be bullet points)>
    PERFORMANCE_SCORE|| <0-100>
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"SUMMARY|| Error generating AI analysis: {str(e)}"


def analyze_deployment(version, before, after, comparison):

    prompt = f"""
    You are an expert Site Reliability Engineer and DevOps specialist.

    A new deployment was released. Analyze the performance impact:

    Deployment Version: {version}

    Performance Before:
    - LCP: {before.get('LCP')}s | CLS: {before.get('CLS')} | INP: {before.get('INP')}ms
    - JS Errors: {before.get('errors')} | API Errors: {before.get('api_errors', 0)}

    Performance After:
    - LCP: {after.get('LCP')}s | CLS: {after.get('CLS')} | INP: {after.get('INP')}ms
    - JS Errors: {after.get('errors')} | API Errors: {after.get('api_errors', 0)}

    Changes:
    {comparison}

    Provide structured deployment analysis using || separator:
    DEPLOYMENT_STATUS|| (HEALTHY/WARNING/CRITICAL)
    REGRESSION_SEVERITY|| (NONE/MINOR/MODERATE/SEVERE)
    ROOT_CAUSE|| Primary issue causing changes
    AFFECTED_METRIC|| Most impacted metric
    RECOMMENDED_ACTION|| Immediate action needed
    CONFIDENCE|| 0-100%
    
    Be direct and precise. Focus on actionability.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content
