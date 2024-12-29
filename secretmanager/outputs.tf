output "policy_arm" {
  value = aws_iam_policy.default.arn
}

output "key" {
  value = aws_secretsmanager_secret.default.name
}
